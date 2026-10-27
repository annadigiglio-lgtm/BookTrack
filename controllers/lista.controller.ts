// controllers/lista.controller.ts
// scaffali personali dell'utente
// togliere uno scaffale non cancella i libri salvati


import type { Request, Response } from "express";
import Lista from "../models/Lista";
import Contenuto from "../models/Contenuto";
import { AppError } from "../utils/AppError";
import { trovaMio } from "../utils/proprieta";
import { ok } from "../utils/risposta";
import { idUtente } from "../utils/utente";
import { campiObbligatori, isObjectId } from "../utils/validazione";


// POST /api/scaffali       body: { nome, descrizione? }

export async function crea(req: Request, res: Response) {
    campiObbligatori(req.body, ["nome"]);
    const userId = idUtente(req);
    const nome = String(req.body.nome).trim();

    if (await Lista.exists({ user: userId, nome })) {
        throw new AppError(`Hai già uno scaffale chiamato "${nome}"`, 409);
    }

    const lista = await Lista.create({ user: userId, nome, descrizione: req.body.descrizione ?? "" });
    return ok(res, lista, 201);
}


// GET /api/scaffali

// ritorno i scaffali con il numero di libri dentro
export async function elenco(req: Request, res: Response) {
    const liste = await Lista.find({ user: idUtente(req) }).sort({ createdAt: 1 }).lean();
    const risultato = liste.map(({ contenuti, ...lista }) => ({ ...lista, numeroContenuti: contenuti.length }));
    return ok(res, risultato);
}


// GET /api/scaffali/:id

// con populate metto dentro i libri completi invece di soli id
export async function dettaglio(req: Request, res: Response) {
    const lista = await Lista.findOne({ _id: req.params.id, user: idUtente(req) }).populate("contenuti");
    if (!lista) throw new AppError("Scaffale non trovato", 404);
    return ok(res, lista);
}


// PATCH /api/scaffali/:id  body: { nome?, descrizione? }

export async function aggiorna(req: Request, res: Response) {
    const userId = idUtente(req);
    const lista = await trovaMio(Lista, req.params.id, userId, "Scaffale");
    const { nome, descrizione } = req.body ?? {};

    if (nome === undefined && descrizione === undefined) {
        throw new AppError("Nessun campo da aggiornare (ammessi: nome, descrizione)", 400);
    }

    if (nome !== undefined) {
        const nuovoNome = String(nome).trim();
        if (!nuovoNome) throw new AppError("Il nome non può essere vuoto", 400);
        // controllo che non ci sia già un altro scaffale con lo stesso nome
        if (await Lista.exists({ user: userId, nome: nuovoNome, _id: { $ne: lista._id } })) {
            throw new AppError(`Hai già uno scaffale chiamato "${nuovoNome}"`, 409);
        }
        lista.nome = nuovoNome;
    }
    if (descrizione !== undefined) lista.descrizione = String(descrizione);

    await lista.save();
    return ok(res, lista);
}


// DELETE /api/scaffali/:id

export async function elimina(req: Request, res: Response) {
    const lista = await Lista.findOneAndDelete({ _id: req.params.id, user: idUtente(req) });
    if (!lista) throw new AppError("Scaffale non trovato", 404);
    return ok(res, { messaggio: "Scaffale eliminato", id: lista._id });
}


// POST /api/scaffali/:id/libri     body: { contenutoId }

// aggiungo un libro già salvato a uno scaffale
export async function aggiungiContenuto(req: Request, res: Response) {
    campiObbligatori(req.body, ["contenutoId"]);
    const { contenutoId } = req.body;
    if (!isObjectId(contenutoId)) throw new AppError("contenutoId non valido", 400);
    const userId = idUtente(req);

    // il libro deve essere dell'utente
    await trovaMio(Contenuto, contenutoId, userId, "Libro");

    // addToSet evita duplicati
    const lista = await Lista.findOneAndUpdate(
        { _id: req.params.id, user: userId },
        { $addToSet: { contenuti: contenutoId } },
        { returnDocument: "after" }
    ).populate("contenuti");
    if (!lista) throw new AppError("Scaffale non trovato", 404);

    return ok(res, lista);
}


// DELETE /api/scaffali/:id/libri/:contenutoId

// tolgo il libro dallo scaffale ma non lo cancello dal salvataggio
export async function rimuoviContenuto(req: Request, res: Response) {
    const lista = await Lista.findOneAndUpdate(
        { _id: req.params.id, user: idUtente(req) },
        { $pull: { contenuti: req.params.contenutoId } },
        { returnDocument: "after" }
    ).populate("contenuti");
    if (!lista) throw new AppError("Scaffale non trovato", 404);

    return ok(res, lista);
}


// POST /api/scaffali/:id/libri/:contenutoId/sposta     body: { aScaffaleId }

// sposto un libro da uno scaffale a un altro
export async function spostaContenuto(req: Request, res: Response) {
    campiObbligatori(req.body, ["aScaffaleId"]);
    const { aScaffaleId } = req.body;
    if (!isObjectId(aScaffaleId)) throw new AppError("aScaffaleId non valido", 400);
    if (aScaffaleId === req.params.id) throw new AppError("Il libro è già in questo scaffale", 400);
    const userId = idUtente(req);

    // devo controllare che libro e scaffali appartengano all'utente
    await trovaMio(Contenuto, req.params.contenutoId, userId, "Libro");
    const partenza = await trovaMio(Lista, req.params.id, userId, "Scaffale di partenza");
    await trovaMio(Lista, aScaffaleId, userId, "Scaffale di arrivo");

    // controllo che il libro sia davvero dentro lo scaffale di partenza
    if (!partenza.contenuti.some((id: any) => String(id) === req.params.contenutoId)) {
        throw new AppError("Il libro non è nello scaffale di partenza", 400);
    }

    await Lista.updateOne({ _id: partenza._id }, { $pull: { contenuti: req.params.contenutoId } });
    const arrivo = await Lista.findOneAndUpdate(
        { _id: aScaffaleId, user: userId },
        { $addToSet: { contenuti: req.params.contenutoId } },
        { returnDocument: "after" }
    ).populate("contenuti");

    return ok(res, arrivo);
}

