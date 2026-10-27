
// controllers/rating.controller.ts
// per ogni utente e libro c'è una sola valutazione da 1 a 5

import type { Request, Response } from "express";
import { VOTO_MAX, VOTO_MIN } from "../config/project.config";
import Contenuto from "../models/Content";
import Valutazione from "../models/Rating";
import { AppError } from "../utils/AppError";
import { findOwnedDocument } from "../utils/ownership";
import { ok } from "../utils/response";
import { getUserId } from "../utils/user";
import { numberInRange } from "../utils/validation";

// GET /api/libri/:contenutoId/valutazione

export async function getRating(req: Request, res: Response) {
    const userId = getUserId(req);
    await findOwnedDocument(Contenuto, req.params.contenutoId, userId, "Libro");

    const valutazione = await Valutazione.findOne({ user: userId, contenuto: req.params.contenutoId });
    if (!valutazione) throw new AppError("Non hai ancora valutato questo libro", 404);
    return ok(res, valutazione);
}

// PUT /api/libri/:contenutoId/valutazione     body: { voto }

export async function setRating(req: Request, res: Response) {
    const userId = getUserId(req);
    const voto = numberInRange(req.body?.voto, VOTO_MIN, VOTO_MAX, "voto");
    // il voto va da 1 a 5 e deve essere intero
    if (!Number.isInteger(voto)) throw new AppError("Il voto deve essere un numero intero", 400);

    await findOwnedDocument(Contenuto, req.params.contenutoId, userId, "Libro");

    // se non c'è la creo, se c'è la aggiorno
    const valutazione = await Valutazione.findOneAndUpdate(
        { user: userId, contenuto: req.params.contenutoId },
        { voto },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    return ok(res, valutazione);
}

// DELETE /api/libri/:contenutoId/valutazione

export async function deleteRating(req: Request, res: Response) {
    const valutazione = await Valutazione.findOneAndDelete({ user: getUserId(req), contenuto: req.params.contenutoId });
    if (!valutazione) throw new AppError("Nessuna valutazione da eliminare", 404);
    return ok(res, { messaggio: "Valutazione eliminata" });
}

