
// controllers/content.controller.ts
// libri salvati dall'utente
// ogni query filtra sempre per user = getUserId(req)


import type { Request, Response } from "express";
import { STATI, STATO_DEFAULT, TIPI_CONTENUTO } from "../config/project.config";
import Contenuto from "../models/Content";
import Lista from "../models/Shelf";
import Commento from "../models/Comment";
import Valutazione from "../models/Rating";
import * as catalogo from "../services/catalog.service";
import { AppError } from "../utils/AppError";
import { findOwnedDocument } from "../utils/ownership";
import { ok } from "../utils/response";
import { getUserId } from "../utils/user";
import { requireFields, isValidObjectId, parsePagination, numberInRange, allowedValue } from "../utils/validation";

// campi ordinabili disponibili
const ORDINAMENTI: Record<string, Record<string, 1 | -1>> = {
    recenti: { createdAt: -1 },
    vecchi: { createdAt: 1 },
    titolo: { titolo: 1 },
    anno: { anno: -1 },
};

// tolgo i caratteri speciali così la ricerca non si rompe
function escapeRegex(testo: string) {
    return testo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// POST /api/libri      body: { idEsterno, stato?, listaId? }

// il client manda solo l'id di Open Library e noi prendiamo i dati reali dall'API
export async function save(req: Request, res: Response) {
    requireFields(req.body, ["idEsterno"]);
    const userId = getUserId(req);
    // il tipo non è obbligatorio perché qui c'è solo il libro
    const tipo = allowedValue(req.body.tipo ?? TIPI_CONTENUTO[0], TIPI_CONTENUTO, "tipo");
    const idEsterno = String(req.body.idEsterno).trim();
    const stato = req.body.stato !== undefined ? allowedValue(req.body.stato, STATI, "stato") : STATO_DEFAULT;

    // 1. prendo i dati reali dall'API
    const dati = await catalogo.getDetails(idEsterno, tipo);

    // 2. controllo se questo libro è già salvato dall'utente
    const esiste = await Contenuto.exists({ user: userId, fonte: dati.fonte, tipo, idEsterno: dati.idEsterno });
    if (esiste) {
        throw new AppError("Libro già salvato", 409);
    }

// 3. salvo il libro senza tenere tutto il dettaglio dell'API
    const contenuto = await Contenuto.create({
        user: userId,
        fonte: dati.fonte,
        idEsterno: dati.idEsterno,
        tipo,
        titolo: dati.titolo,
        descrizione: dati.descrizione,
        immagine: dati.immagine,
        anno: dati.anno,
        extra: dati.extra,
        pagine: (dati.extra.pagine as number | null) ?? null,
        stato,
    });

    // 4. se arriva listaId, lo aggiungo subito a quello scaffale
    if (req.body.listaId) {
        if (!isValidObjectId(req.body.listaId)) throw new AppError("listaId non valido", 400);
        await findOwnedDocument(Lista, req.body.listaId, userId, "Scaffale");
        await Lista.updateOne({ _id: req.body.listaId, user: userId }, { $addToSet: { contenuti: contenuto._id } });
    }

    return ok(res, contenuto, 201);
}


// GET /api/libri?stato=&q=&ordina=&pagina=&limite=

// i filtri sono tutti opzionali
export async function getAll(req: Request, res: Response) {
    const filtro: Record<string, unknown> = { user: getUserId(req) };

    if (req.query.stato) filtro.stato = allowedValue(req.query.stato, STATI, "stato");
    if (req.query.q) {
        // ricerca senza differenziare maiuscole e minuscole
        filtro.titolo = { $regex: escapeRegex(String(req.query.q)), $options: "i" };
    }

    const ordina = ORDINAMENTI[String(req.query.ordina ?? "recenti")] ?? ORDINAMENTI.recenti;
    const { pagina, limite, skip } = parsePagination(req.query);

    // faccio le due query insieme
    const [risultati, totale] = await Promise.all([
        Contenuto.find(filtro).sort(ordina).skip(skip).limit(limite),
        Contenuto.countDocuments(filtro),
    ]);

    return ok(res, {
        pagina,
        limite,
        totale,
        totalePagine: Math.ceil(totale / limite),
        risultati,
    });
}


// GET /api/libri/statistiche

// conto quanti libri ci sono per stato e la media dei voti dell'utente
export async function getStatistics(req: Request, res: Response) {
    const userId = getUserId(req);

    const [perStato, voti] = await Promise.all([
        Contenuto.aggregate([{ $match: { user: userId } }, { $group: { _id: "$stato", totale: { $sum: 1 } } }]),
        Valutazione.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, media: { $avg: "$voto" }, numero: { $sum: 1 } } },
        ]),
    ]);

    // trasformo [{ _id: "letto", totale: 3 }] in { letto: 3 }
    const toObjectMap = (rows: any[]) => Object.fromEntries(rows.map((row) => [row._id, row.totale]));

    return ok(res, {
        totale: perStato.reduce((somma, r) => somma + r.totale, 0),
        perStato: toObjectMap(perStato),
        voti: {
            numero: voti[0]?.numero ?? 0,
            media: voti[0] ? Math.round(voti[0].media * 10) / 10 : null,
        },
    });
}


// GET /api/libri/:id            (?completo=true per i dati completi dall'API)

export async function getDetails(req: Request, res: Response) {
    const userId = getUserId(req);
    const contenuto = await findOwnedDocument(Contenuto, req.params.id, userId, "Libro");

    // prendo anche la valutazione dell'utente, se c'è
    const valutazione = await Valutazione.findOne({ user: userId, contenuto: contenuto._id }).select("voto updatedAt");

    const risposta: Record<string, unknown> = { ...contenuto.toObject(), valutazione };

    if (req.query.completo === "true") {
        const api = await catalogo.getDetails(contenuto.idEsterno, contenuto.tipo);
        risposta.dettagli = api.dettagli;
    }

    return ok(res, risposta);
}


// PATCH /api/libri/:id          body: { note?, pagine? }

// aggiorno solo i campi che l'utente può cambiare
export async function update(req: Request, res: Response) {
    const body = req.body ?? {};
    const modifiche: Record<string, unknown> = {};

    if (body.note !== undefined) modifiche.note = String(body.note);
    if (body.pagine !== undefined) {
        const pagine = numberInRange(body.pagine, 1, 100000, "pagine");
        if (!Number.isInteger(pagine)) throw new AppError('"pagine" deve essere un numero intero', 400);
        modifiche.pagine = pagine;
    }

    if (Object.keys(modifiche).length === 0) {
        throw new AppError("Nessun campo da aggiornare (ammessi: note, pagine)", 400);
    }

    // ritorno il documento già aggiornato
    const contenuto = await Contenuto.findOneAndUpdate(
        { _id: req.params.id, user: getUserId(req) },
        modifiche,
        { returnDocument: "after", runValidators: true }
    );
    if (!contenuto) throw new AppError("Libro non trovato", 404);

    return ok(res, contenuto);
}


// PATCH /api/libri/:id/stato    body: { stato }

// aggiorno lo stato del libro e azzero o porto a fine pagina se serve
export async function updateStatus(req: Request, res: Response) {
    requireFields(req.body, ["stato"]);
    const stato = allowedValue(req.body.stato, STATI, "stato");

    const contenuto = await findOwnedDocument(Contenuto, req.params.id, getUserId(req), "Libro");

    contenuto.stato = stato;
    if (stato === "da_leggere") contenuto.paginaCorrente = 0;
    if (stato === "letto" && contenuto.pagine) contenuto.paginaCorrente = contenuto.pagine;
    await contenuto.save();

    return ok(res, contenuto);
}


// PATCH /api/libri/:id/progresso    body: { paginaCorrente }

// Aggiorna la pagina a cui è arrivato l'utente e restituisce la percentuale.
// Si può fare solo per i libri "in lettura".
export async function updateProgress(req: Request, res: Response) {
    requireFields(req.body, ["paginaCorrente"]);
    const contenuto = await findOwnedDocument(Contenuto, req.params.id, getUserId(req), "Libro");

    if (contenuto.stato !== "in_lettura") {
        throw new AppError('Puoi aggiornare la pagina corrente solo dei libri "in_lettura"', 400);
    }

    // la pagina non può superare il totale, se lo sappiamo
    const massimo = contenuto.pagine ?? 100000;
    const paginaCorrente = numberInRange(req.body.paginaCorrente, 0, massimo, "paginaCorrente");
    if (!Number.isInteger(paginaCorrente)) throw new AppError('"paginaCorrente" deve essere un numero intero', 400);

    contenuto.paginaCorrente = paginaCorrente;
    await contenuto.save();

    // percentuale è un campo calcolato del modello
    return ok(res, {
        paginaCorrente: contenuto.paginaCorrente,
        pagine: contenuto.pagine,
        percentuale: contenuto.percentuale,
        libro: contenuto,
    });
}


// DELETE /api/libri/:id

// tolgo il libro e anche commenti e valutazioni collegate
export async function deleteContent(req: Request, res: Response) {
    const userId = getUserId(req);
    const contenuto = await Contenuto.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!contenuto) throw new AppError("Libro non trovato", 404);

    await Promise.all([
        Lista.updateMany({ user: userId }, { $pull: { contenuti: contenuto._id } }),
        Commento.deleteMany({ contenuto: contenuto._id }),
        Valutazione.deleteMany({ contenuto: contenuto._id }),
    ]);

    return ok(res, { messaggio: "Libro eliminato", id: contenuto._id });
}

