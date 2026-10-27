// "authenticate": da mettere davanti a ogni rotta protetta.

// Usa la strategia "jwt" di config/passport.config.ts.
// Rispetto a  passport.authenticate("jwt", { session: false })
// (che risponde 401 in testo semplice "Unauthorized"), qui usiamo la
// callback personalizzata per rispondere con il NOSTRO formato JSON
// e con un messaggio (token mancante / scaduto / dopo logout).

import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { AppError } from "../utils/AppError";

export function authenticate(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("jwt", { session: false }, (err: any, utente: any, info: any) => {
        if (err) return next(err);

        if (!utente) {
            // "info" spiega perché Passport ha rifiutato
            let messaggio = "Token mancante o non valido";
            if (info?.name === "TokenExpiredError") messaggio = "Token scaduto: effettua di nuovo il login";
            else if (info?.message === "No auth token") messaggio = "Token mancante: aggiungi l'header Authorization: Bearer <token>";
            else if (info?.message) messaggio = info.message;
            return next(new AppError(messaggio, 401));
        }

        req.user = utente; // da qui in poi: getUserId(req) in utils/user.ts
        next();
    })(req, res, next);
}

// Ruoli - Da usare DOPO authenticate:
//     router.get("/admin/utenti", authenticate, requireRole("admin"), elencoUtenti);
// 403 = sei autenticato ma non hai il permesso.

export function requireRole(...ruoli: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const ruolo = (req.user as any)?.ruolo;
        if (!ruoli.includes(ruolo)) {
            return next(new AppError("Accesso negato: permessi insufficienti", 403));
        }
        next();
    };
}

