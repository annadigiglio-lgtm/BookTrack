
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

function leggiTesto(body: any): string {
    campiObbligatori(body, ["testo"]);
    const testo = String(body.testo).trim();
    if (testo.length > COMMENTO_MAX) {
        throw new AppError(`Il commento può avere al massimo ${COMMENTO_MAX} caratteri`, 400);
    }
    return testo;
}


// GET /api/libri/:contenutoId/commenti

export async function elenco(req: Request, res: Response) {
    const userId = idUtente(req);
    await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");

    // li prendo dal più recente e aggiungo il nome dell'autore
    const commenti = await Commento.find({ contenuto: req.params.contenutoId })
        .sort({ createdAt: -1 })
        .populate("user", "nome");
    return ok(res, commenti);
}


// POST /api/libri/:contenutoId/commenti     body: { testo }

export async function crea(req: Request, res: Response) {
    const userId = idUtente(req);
    const testo = leggiTesto(req.body);
    const contenuto = await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");

    const commento = await Commento.create({ user: userId, contenuto: contenuto._id, testo });
    return ok(res, commento, 201);
}


// PATCH /api/commenti/:id      body: { testo }

// solo l'autore può cambiarlo
export async function aggiorna(req: Request, res: Response) {
    const testo = leggiTesto(req.body);
    const commento = await Commento.findOneAndUpdate(
        { _id: req.params.id, user: idUtente(req) },
        { testo },
        { returnDocument: "after", runValidators: true }
    );
    if (!commento) throw new AppError("Commento non trovato", 404);
    return ok(res, commento);
}


// DELETE /api/commenti/:id

export async function elimina(req: Request, res: Response) {
    const commento = await Commento.findOneAndDelete({ _id: req.params.id, user: idUtente(req) });
    if (!commento) throw new AppError("Commento non trovato", 404);
    return ok(res, { messaggio: "Commento eliminato", id: commento._id });
}

