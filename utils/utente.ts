
// utils/utente.ts  –  usato da TUTTI

// Restituisce l'_id dell'utente loggato.
// Passport (middleware/auth.middleware.ts) mette l'utente in req.user;
// TypeScript però non sa che req.user ha "_id", quindi nella prova
// scrivevamo ovunque (req.user as any)._id. Così lo scriviamo una volta sola:
//
//     const userId = idUtente(req);
//
//  Usatelo SOLO nelle rotte protette (dopo il middleware "autentica").

import type { Request } from "express";
import { AppError } from "./AppError";

export function idUtente(req: Request) {
    const user = req.user as any;
    if (!user?._id) {
        // Succede solo se ci si dimentica il middleware "autentica" sulla rotta
        throw new AppError("Utente non autenticato", 401);
    }
    return user._id;
}
