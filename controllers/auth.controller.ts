// ============================================================
// controllers/auth.controller.ts
// ============================================================
// Un controller è una funzione (req, res) che: legge la richiesta,
// valida i dati, usa modelli/service e manda la risposta.
// Gli URL NON stanno qui ma in routes/auth.routes.ts.
//
// Express 5: niente try/catch. Se qualcosa lancia un errore (anche un
// AppError nostro), Express lo passa da solo a middleware/error.middleware.ts.
//
// | Funzione       | Rotta                    | Protetta |
// |----------------|--------------------------|----------|
// | register       | POST   /api/auth/register| no       |
// | login          | POST   /api/auth/login   | no       |
// | logout         | POST   /api/auth/logout  | sì       |
// | me             | GET    /api/auth/me      | sì       |
// | aggiornaMe     | PATCH  /api/auth/me      | sì       |
// | eliminaMe      | DELETE /api/auth/me      | sì       |
// ============================================================

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config";
import { LISTE_PREDEFINITE, PASSWORD_MIN } from "../config/progetto.config";
import User from "../models/User";
import Contenuto from "../models/Contenuto";
import Lista from "../models/Lista";
import Commento from "../models/Commento";
import Valutazione from "../models/Valutazione";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/risposta";
import { idUtente } from "../utils/utente";
import { campiObbligatori, emailValida } from "../utils/validazione";

// Crea il JWT. Il payload { id } è quello che legge config/passport.config.ts.
function creaToken(userId: unknown): string {
    return jwt.sign({ id: String(userId) }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
        algorithm: "HS256",
    });
}

// ------------------------------------------------------------
// POST /api/auth/register      body: { nome, email, password }
// ------------------------------------------------------------
export async function register(req: Request, res: Response) {
    campiObbligatori(req.body, ["nome", "email", "password"]);
    const { nome, email, password } = req.body;

    if (!emailValida(email)) {
        throw new AppError("Formato email non valido", 400);
    }
    if (String(password).length < PASSWORD_MIN) {
        throw new AppError(`La password deve avere almeno ${PASSWORD_MIN} caratteri`, 400);
    }

    // Controllo esplicito per un messaggio chiaro (l'indice unique farebbe comunque 409)
    const esiste = await User.exists({ email: String(email).toLowerCase() });
    if (esiste) {
        throw new AppError("Email già registrata", 409);
    }

    // MAI salvare la password in chiaro: solo l'hash. 10 = "costo" (giri di cifratura)
    const hash = await bcrypt.hash(String(password), 10);
    const utente = await User.create({ nome, email, password: hash });

    // Scaffali creati in automatico: "Da leggere", "In lettura", "Letti" (vedi LISTE_PREDEFINITE)
    if (LISTE_PREDEFINITE.length > 0) {
        await Lista.insertMany(LISTE_PREDEFINITE.map((nomeLista) => ({ user: utente._id, nome: nomeLista })));
    }

    // 201 Created. password e token vengono tolti dal toJSON del modello.
    return ok(res, utente, 201);
}

// ------------------------------------------------------------
// POST /api/auth/login         body: { email, password }
// ------------------------------------------------------------
export async function login(req: Request, res: Response) {
    campiObbligatori(req.body, ["email", "password"]);
    const { email, password } = req.body;

    // "+password": il campo ha select:false, va chiesto esplicitamente
    const utente = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

    // STESSO messaggio se sbaglia email o password: non diciamo quale dei due
    // (altrimenti si potrebbe scoprire quali email sono registrate)
    const passwordGiusta = utente ? await bcrypt.compare(String(password), utente.password) : false;
    if (!utente || !passwordGiusta) {
        throw new AppError("Credenziali non valide", 401);
    }

    const token = creaToken(utente._id);

    // Salviamo il token: serve per il logout (vedi passport.config.ts)
    utente.token = token;
    await utente.save();

    return ok(res, {
        token,
        tipo: "Bearer",
        scadenza: env.jwtExpiresIn,
        utente, // senza password/token grazie al toJSON
    });
}

// ------------------------------------------------------------
// POST /api/auth/logout        (protetta)
// ------------------------------------------------------------
// Il JWT di per sé non si può "cancellare" (è valido fino alla scadenza).
// Per questo salviamo il token nello User: mettendolo a null, Passport
// rifiuta il vecchio token -> logout vero lato server.
export async function logout(req: Request, res: Response) {
    await User.updateOne({ _id: idUtente(req) }, { token: null });
    return ok(res, { messaggio: "Logout effettuato" });
}

// ------------------------------------------------------------
// GET /api/auth/me             (protetta)
// ------------------------------------------------------------
// req.user lo ha messo Passport. Il toJSON del modello toglie token e password.
export async function me(req: Request, res: Response) {
    return ok(res, req.user);
}

// ------------------------------------------------------------
// PATCH /api/auth/me   body: { nome?, passwordAttuale?, nuovaPassword? }
// ------------------------------------------------------------
export async function aggiornaMe(req: Request, res: Response) {
    const { nome, passwordAttuale, nuovaPassword } = req.body ?? {};
    const utente = await User.findById(idUtente(req)).select("+password");
    if (!utente) throw new AppError("Utente non trovato", 404);

    if (nome !== undefined) {
        if (!String(nome).trim()) throw new AppError("Il nome non può essere vuoto", 400);
        utente.nome = String(nome).trim();
    }

    // Cambio password: serve quella attuale (se qualcuno ruba il token
    // non può cambiare la password senza conoscerla)
    if (nuovaPassword !== undefined) {
        if (!passwordAttuale || !(await bcrypt.compare(String(passwordAttuale), utente.password))) {
            throw new AppError("Password attuale errata", 401);
        }
        if (String(nuovaPassword).length < PASSWORD_MIN) {
            throw new AppError(`La password deve avere almeno ${PASSWORD_MIN} caratteri`, 400);
        }
        utente.password = await bcrypt.hash(String(nuovaPassword), 10);
    }

    await utente.save();
    return ok(res, utente);
}

// ------------------------------------------------------------
// DELETE /api/auth/me
// ------------------------------------------------------------
// Elimina l'account e TUTTI i suoi dati (eliminazione "a cascata").
export async function eliminaMe(req: Request, res: Response) {
    const userId = idUtente(req);
    await Promise.all([
        Contenuto.deleteMany({ user: userId }),
        Lista.deleteMany({ user: userId }),
        Commento.deleteMany({ user: userId }),
        Valutazione.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });
    return ok(res, { messaggio: "Account e dati eliminati" });
}
