 
// controllers/auth.controller.ts
// registrazione, login e profilo utente

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

// creo il token con l'id dell'utente
function creaToken(userId: unknown): string {
    return jwt.sign({ id: String(userId) }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
        algorithm: "HS256",
    });
}

// POST /api/auth/register      body: { nome, email, password }

export async function register(req: Request, res: Response) {
    campiObbligatori(req.body, ["nome", "email", "password"]);
    const { nome, email, password } = req.body;

    if (!emailValida(email)) {
        throw new AppError("Formato email non valido", 400);
    }
    if (String(password).length < PASSWORD_MIN) {
        throw new AppError(`La password deve avere almeno ${PASSWORD_MIN} caratteri`, 400);
    }

    // controllo se l'email è già usata
    const esiste = await User.exists({ email: String(email).toLowerCase() });
    if (esiste) {
        throw new AppError("Email già registrata", 409);
    }

    // salvo solo l'hash
    const hash = await bcrypt.hash(String(password), 10);
    const utente = await User.create({ nome, email, password: hash });

    // creo subito gli scaffali base
    if (LISTE_PREDEFINITE.length > 0) {
        await Lista.insertMany(LISTE_PREDEFINITE.map((nomeLista) => ({ user: utente._id, nome: nomeLista })));
    }

    // rispondo con 201 anche se il modello toJSON toglie password e token
    return ok(res, utente, 201);
}


// POST /api/auth/login         body: { email, password }

export async function login(req: Request, res: Response) {
    campiObbligatori(req.body, ["email", "password"]);
    const { email, password } = req.body;

    // il campo password è nascosto di default, quindi lo chiedo esplicitamente
    const utente = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

    // faccio lo stesso errore per email o password sbagliate
    const passwordGiusta = utente ? await bcrypt.compare(String(password), utente.password) : false;
    if (!utente || !passwordGiusta) {
        throw new AppError("Credenziali non valide", 401);
    }

    const token = creaToken(utente._id);

    // salvo il token per fare il logout
    utente.token = token;
    await utente.save();

    return ok(res, {
        token,
        tipo: "Bearer",
        scadenza: env.jwtExpiresIn,
        utente, // senza password/token grazie al toJSON
    });
}


// POST /api/auth/logout        (protetta)

// il JWT non si cancella da solo, quindi lo salvo a null nel database
export async function logout(req: Request, res: Response) {
    await User.updateOne({ _id: idUtente(req) }, { token: null });
    return ok(res, { messaggio: "Logout effettuato" });
}


// GET /api/auth/me             (protetta)

// req.user arriva da Passport
export async function me(req: Request, res: Response) {
    return ok(res, req.user);
}


// PATCH /api/auth/me   body: { nome?, passwordAttuale?, nuovaPassword? }

export async function aggiornaMe(req: Request, res: Response) {
    const { nome, passwordAttuale, nuovaPassword } = req.body ?? {};
    const utente = await User.findById(idUtente(req)).select("+password");
    if (!utente) throw new AppError("Utente non trovato", 404);

    if (nome !== undefined) {
        if (!String(nome).trim()) throw new AppError("Il nome non può essere vuoto", 400);
        utente.nome = String(nome).trim();
    }

    // se cambio password, controllo prima quella attuale
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


// DELETE /api/auth/me

// cancello anche tutti i dati legati a questo utente
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

