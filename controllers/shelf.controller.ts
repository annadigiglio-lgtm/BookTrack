// controllers/shelf.controller.ts
// scaffali personali dell'utente
// togliere uno scaffale non cancella i libri salvati


import type { Request, Response } from "express";
import Lista from "../models/Shelf";
import Contenuto from "../models/Content";
import { AppError } from "../utils/AppError";
import { findOwnedDocument } from "../utils/ownership";
import { ok } from "../utils/response";
import { getUserId } from "../utils/user";
import { requireFields, isValidObjectId } from "../utils/validation";


// POST /api/scaffali       body: { nome, descrizione? }

export async function create(req: Request, res: Response) {
    requireFields(req.body, ["nome"]);
    const userId = getUserId(req);
    const nome = String(req.body.nome).trim();

    if (await Lista.exists({ user: userId, nome })) {
        throw new AppError(`Hai già uno scaffale chiamato "${nome}"`, 409);
    }

    const lista = await Lista.create({ user: userId, nome, descrizione: req.body.descrizione ?? "" });
    return ok(res, lista, 201);
}


// GET /api/scaffali

// ritorno i scaffali con il numero di libri dentro
export async function getAll(req: Request, res: Response) {
    const liste = await Lista.find({ user: getUserId(req) }).sort({ createdAt: 1 }).lean();
    const risultato = liste.map(({ contenuti, ...lista }) => ({ ...lista, numeroContenuti: contenuti.length }));
    return ok(res, risultato);
}


// GET /api/scaffali/:id

// con populate metto dentro i libri completi invece di soli id
export async function getDetails(req: Request, res: Response) {
    const lista = await Lista.findOne({ _id: req.params.id, user: getUserId(req) }).populate("contenuti");
    if (!lista) throw new AppError("Scaffale non trovato", 404);
    return ok(res, lista);
}


// PATCH /api/scaffali/:id  body: { nome?, descrizione? }

export async function update(req: Request, res: Response) {
    const userId = getUserId(req);
    const lista = await findOwnedDocument(Lista, req.params.id, userId, "Scaffale");
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

export async function deleteList(req: Request, res: Response) {
    const lista = await Lista.findOneAndDelete({ _id: req.params.id, user: getUserId(req) });
    if (!lista) throw new AppError("Scaffale non trovato", 404);
    return ok(res, { messaggio: "Scaffale eliminato", id: lista._id });
}


// POST /api/scaffali/:id/libri     body: { contenutoId }

// aggiungo un libro già salvato a uno scaffale
export async function addContent(req: Request, res: Response) {
    requireFields(req.body, ["contenutoId"]);
    const { contenutoId } = req.body;
    if (!isValidObjectId(contenutoId)) throw new AppError("contenutoId non valido", 400);
    const userId = getUserId(req);

    // il libro deve essere dell'utente
    await findOwnedDocument(Contenuto, contenutoId, userId, "Libro");

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
export async function removeContent(req: Request, res: Response) {
    const lista = await Lista.findOneAndUpdate(
        { _id: req.params.id, user: getUserId(req) },
        { $pull: { contenuti: req.params.contenutoId } },
        { returnDocument: "after" }
    ).populate("contenuti");
    if (!lista) throw new AppError("Scaffale non trovato", 404);

    return ok(res, lista);
}


// POST /api/scaffali/:id/libri/:contenutoId/sposta     body: { aScaffaleId }

// sposto un libro da uno scaffale a un altro
export async function moveContent(req: Request, res: Response) {
    requireFields(req.body, ["aScaffaleId"]);
    const { aScaffaleId } = req.body;
    if (!isValidObjectId(aScaffaleId)) throw new AppError("aScaffaleId non valido", 400);
    if (aScaffaleId === req.params.id) throw new AppError("Il libro è già in questo scaffale", 400);
    const userId = getUserId(req);

    // devo controllare che libro e scaffali appartengano all'utente
    await findOwnedDocument(Contenuto, req.params.contenutoId, userId, "Libro");
    const partenza = await findOwnedDocument(Lista, req.params.id, userId, "Scaffale di partenza");
    await findOwnedDocument(Lista, aScaffaleId, userId, "Scaffale di arrivo");

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

