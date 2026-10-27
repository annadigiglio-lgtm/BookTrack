
// controllers/commento.controller.ts
// recensioni dei libri salvati
// controllo che il libro appartenga all'utente

import type { Request, Response } from "express";
import { COMMENTO_MAX } from "../config/progetto.config";
import Commento from "../models/Commento";
import Contenuto from "../models/Contenuto";
import { AppError } from "../utils/AppError";
import { trovaMio } from "../utils/proprieta";
import { ok } from "../utils/risposta";
import { idUtente } from "../utils/utente";
import { campiObbligatori } from "../utils/validazione";

function readText(body: any): string {
    campiObbligatori(body, ["testo"]);
    const text = String(body.testo).trim();
    if (text.length > COMMENTO_MAX) {
        throw new AppError(`Il commento può avere al massimo ${COMMENTO_MAX} caratteri`, 400);
    }
    return text;
}


// GET /api/libri/:contenutoId/commenti

export async function getComments(req: Request, res: Response) {
    const userId = idUtente(req);
    await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");

    // li prendo dal più recente e aggiungo il nome dell'autore
    const comments = await Commento.find({ contenuto: req.params.contenutoId })
        .sort({ createdAt: -1 })
        .populate("user", "nome");
    return ok(res, comments);
}


// POST /api/libri/:contenutoId/commenti     body: { testo }

export async function createComment(req: Request, res: Response) {
    const userId = idUtente(req);
    const text = readText(req.body);
    const content = await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");

    const comment = await Commento.create({ user: userId, contenuto: content._id, testo: text });
    return ok(res, comment, 201);
}


// PATCH /api/commenti/:id      body: { testo }

// solo l'autore può cambiarlo
export async function updateComment(req: Request, res: Response) {
    const text = readText(req.body);
    const comment = await Commento.findOneAndUpdate(
        { _id: req.params.id, user: idUtente(req) },
        { testo: text },
        { returnDocument: "after", runValidators: true }
    );
    if (!comment) throw new AppError("Commento non trovato", 404);
    return ok(res, comment);
}


// DELETE /api/commenti/:id

export async function deleteComment(req: Request, res: Response) {
    const comment = await Commento.findOneAndDelete({ _id: req.params.id, user: idUtente(req) });
    if (!comment) throw new AppError("Commento non trovato", 404);
    return ok(res, { messaggio: "Commento eliminato", id: comment._id });
}

