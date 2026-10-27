// ============================================================
// controllers/valutazione.controller.ts
// ============================================================
// UNA valutazione (da 1 a 5) per utente per libro.
//
// | Funzione  | Rotta                                           | Body  |
// |-----------|-------------------------------------------------|-------|
// | leggi     | GET    /api/libri/:contenutoId/valutazione  |       |
// | imposta   | PUT    /api/libri/:contenutoId/valutazione  | voto  |
// | elimina   | DELETE /api/libri/:contenutoId/valutazione  |       |
//
// PUT (e non POST) perché "imposta il valore": la stessa richiesta
// ripetuta dà sempre lo stesso risultato (crea la prima volta, poi aggiorna).
// ============================================================

import type { Request, Response } from "express";
import { VOTO_MAX, VOTO_MIN } from "../config/progetto.config";
import Contenuto from "../models/Contenuto";
import Valutazione from "../models/Valutazione";
import { AppError } from "../utils/AppError";
import { trovaMio } from "../utils/proprieta";
import { ok } from "../utils/risposta";
import { idUtente } from "../utils/utente";
import { numeroTra } from "../utils/validazione";

// ------------------------------------------------------------
// GET /api/libri/:contenutoId/valutazione
// ------------------------------------------------------------
export async function leggi(req: Request, res: Response) {
    const userId = idUtente(req);
    await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");

    const valutazione = await Valutazione.findOne({ user: userId, contenuto: req.params.contenutoId });
    if (!valutazione) throw new AppError("Non hai ancora valutato questo libro", 404);
    return ok(res, valutazione);
}

// ------------------------------------------------------------
// PUT /api/libri/:contenutoId/valutazione     body: { voto }
// ------------------------------------------------------------
export async function imposta(req: Request, res: Response) {
    const userId = idUtente(req);
    const voto = numeroTra(req.body?.voto, VOTO_MIN, VOTO_MAX, "voto");
    // Il voto è da 1 a 5 stelle: solo numeri interi
    if (!Number.isInteger(voto)) throw new AppError("Il voto deve essere un numero intero", 400);

    await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");

    // upsert: se non esiste la crea, se esiste la aggiorna (una sola query)
    const valutazione = await Valutazione.findOneAndUpdate(
        { user: userId, contenuto: req.params.contenutoId },
        { voto },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    return ok(res, valutazione);
}

// ------------------------------------------------------------
// DELETE /api/libri/:contenutoId/valutazione
// ------------------------------------------------------------
export async function elimina(req: Request, res: Response) {
    const valutazione = await Valutazione.findOneAndDelete({ user: idUtente(req), contenuto: req.params.contenutoId });
    if (!valutazione) throw new AppError("Nessuna valutazione da eliminare", 404);
    return ok(res, { messaggio: "Valutazione eliminata" });
}
