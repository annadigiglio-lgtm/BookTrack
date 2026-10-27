// ============================================================
// utils/AppError.ts  –  usato da TUTTI
// ============================================================
// Errore "nostro", con lo status HTTP dentro.
// Nei controller e nei service basta scrivere:
//
//     throw new AppError("Lista non trovata", 404);
//
// e ci pensa middleware/error.middleware.ts a mandare la risposta JSON.
//
// Con Express 5 NON serve try/catch nei controller async: se una funzione
// async lancia un errore, Express lo passa da solo al middleware degli errori.
// (Con Express 4 serviva l'asyncHandler: qui non c'è perché non serve.)
// ============================================================

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
