 
// controllers/auth.controller.ts
// registrazione, login e profilo utente

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config";
import { LISTE_PREDEFINITE, PASSWORD_MIN } from "../config/project.config";
import User from "../models/User";
import Contenuto from "../models/Content";
import Lista from "../models/Shelf";
import Commento from "../models/Comment";
import Valutazione from "../models/Rating";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { getUserId } from "../utils/user";
import { requireFields, isValidEmail } from "../utils/validation";

// creo il token con l'id dell'utente
function createToken(userId: unknown): string {
    return jwt.sign({ id: String(userId) }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
        algorithm: "HS256",
    });
}

// POST /api/auth/register      body: { nome, email, password }

export async function register(req: Request, res: Response) {
    requireFields(req.body, ["nome", "email", "password"]);
    const { nome: name, email, password } = req.body;

    if (!isValidEmail(email)) {
        throw new AppError("Formato email non valido", 400);
    }
    if (String(password).length < PASSWORD_MIN) {
        throw new AppError(`La password deve avere almeno ${PASSWORD_MIN} caratteri`, 400);
    }

    // controllo se l'email è già usata
    const userExists = await User.exists({ email: String(email).toLowerCase() });
    if (userExists) {
        throw new AppError("Email già registrata", 409);
    }

    // salvo solo l'hash, non la password vera
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ nome: name, email, password: passwordHash });

    // creo subito gli scaffali base
    if (LISTE_PREDEFINITE.length > 0) {
        await Lista.insertMany(LISTE_PREDEFINITE.map((listName) => ({ user: user._id, nome: listName })));
    }

    // rispondo con 201 anche se il modello toJSON toglie password e token
    return ok(res, user, 201);
}


// POST /api/auth/login         body: { email, password }

export async function login(req: Request, res: Response) {
    requireFields(req.body, ["email", "password"]);
    const { email, password } = req.body;

    // il campo password è nascosto di default, quindi lo chiedo esplicitamente
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

    // faccio lo stesso errore per email o password sbagliate
    const passwordMatches = user ? await bcrypt.compare(String(password), user.password) : false;
    if (!user || !passwordMatches) {
        throw new AppError("Credenziali non valide", 401);
    }

    const token = createToken(user._id);

    // salvo il token per fare il logout
    user.token = token;
    await user.save();

    return ok(res, {
        token,
        tipo: "Bearer",
        scadenza: env.jwtExpiresIn,
        utente: user, // senza password/token grazie al toJSON
    });
}


// POST /api/auth/logout        (protetta)

// il JWT non si cancella da solo, quindi lo salvo a null nel database
export async function logout(req: Request, res: Response) {
    await User.updateOne({ _id: getUserId(req) }, { token: null });
    return ok(res, { messaggio: "Logout effettuato" });
}


// GET /api/auth/me             (protetta)

// req.user arriva da Passport
export async function me(req: Request, res: Response) {
    return ok(res, req.user);
}


// PATCH /api/auth/me   body: { nome?, passwordAttuale?, nuovaPassword? }

export async function updateMe(req: Request, res: Response) {
    const { nome: name, passwordAttuale: currentPassword, nuovaPassword: newPassword } = req.body ?? {};
    const user = await User.findById(getUserId(req)).select("+password");
    if (!user) throw new AppError("Utente non trovato", 404);

    if (name !== undefined) {
        if (!String(name).trim()) throw new AppError("Il nome non può essere vuoto", 400);
        user.nome = String(name).trim();
    }

    // se cambio password, controllo prima quella attuale
    if (newPassword !== undefined) {
        if (!currentPassword || !(await bcrypt.compare(String(currentPassword), user.password))) {
            throw new AppError("Password attuale errata", 401);
        }
        if (String(newPassword).length < PASSWORD_MIN) {
            throw new AppError(`La password deve avere almeno ${PASSWORD_MIN} caratteri`, 400);
        }
        user.password = await bcrypt.hash(String(newPassword), 10);
    }

    await user.save();
    return ok(res, user);
}


// DELETE /api/auth/me

// cancello anche tutti i dati legati a questo utente
export async function deleteMe(req: Request, res: Response) {
    const userId = getUserId(req);
    await Promise.all([
        Contenuto.deleteMany({ user: userId }),
        Lista.deleteMany({ user: userId }),
        Commento.deleteMany({ user: userId }),
        Valutazione.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });
    return ok(res, { messaggio: "Account e dati eliminati" });
}

