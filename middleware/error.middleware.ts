// Due middleware, da registrare in app.ts 
// Express riconosce il gestore errori perché ha QUATTRO parametri (err, req, res, next).
//
// Tabella degli errori gestiti:
//   AppError                          -> il suo statusCode
//   JSON malformato nel body          -> 400
//   ValidationError (mongoose)        -> 400 con i messaggi dei campi
//   CastError (id non valido)         -> 400
//   codice 11000 (chiave duplicata)   -> 409
//   JsonWebTokenError / Expired       -> 401
//   tutto il resto                    -> 500 (senza dettagli interni al client)


import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
    next(new AppError(`Rotta non trovata: ${req.method} ${req.originalUrl}`, 404));
}

export function gestoreErrori(err: any, _req: Request, res: Response, _next: NextFunction) {
    let status = 500;
    let message = "Errore interno del server";

    if (err instanceof AppError) {
        status = err.statusCode;
        message = err.message;
    } else if (err.type === "entity.parse.failed") {
        // express.json() non riesce a leggere il body (es. virgola di troppo in Postman)
        status = 400;
        message = "JSON del body non valido";
    } else if (err.name === "ValidationError") {
        status = 400;
        // Unisce i messaggi di tutti i campi sbagliati
        message = Object.values(err.errors).map((e: any) => e.message).join("; ");
    } else if (err.name === "CastError") {
        status = 400;
        message = `Valore non valido per il campo "${err.path}"`;
    } else if (err.code === 11000) {
        status = 409;
        const campi = Object.keys(err.keyValue ?? {}).join(", ");
        message = `Elemento già esistente (duplicato su: ${campi})`;
    } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        status = 401;
        message = "Token non valido o scaduto";
    }

    // In console stampiamo tutto (utile in sviluppo), al client solo il messaggio
    if (status >= 500) console.error("💥", err);
    else console.warn(`⚠️  ${status} - ${message}`);

    res.status(status).json({
        success: false,
        error: { message, status },
    });
}
