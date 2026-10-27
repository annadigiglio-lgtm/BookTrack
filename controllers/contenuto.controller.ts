// ============================================================
// controllers/contenuto.controller.ts  –  I libri salvati dall'utente
// ============================================================
// Gestisce i libri SALVATI dall'utente (models/Contenuto.ts).
// REGOLA D'ORO: ogni query filtra per user = idUtente(req).
//
// | Funzione        | Rotta                           | Body / Query                                  |
// |-----------------|---------------------------------|-----------------------------------------------|
// | salva           | POST   /api/libri               | idEsterno, stato?, listaId?                   |
// | elenco          | GET    /api/libri               | ?stato=&q=&ordina=&pagina=&limite=            |
// | statistiche     | GET    /api/libri/statistiche   |                                               |
// | dettaglio       | GET    /api/libri/:id           | ?completo=true -> aggiunge i dati dell'API    |
// | aggiorna        | PATCH  /api/libri/:id           | note?, pagine?                                |
// | aggiornaStato   | PATCH  /api/libri/:id/stato     | stato                                         |
// | aggiornaProgresso | PATCH /api/libri/:id/progresso | paginaCorrente                                |
// | elimina         | DELETE /api/libri/:id           |                                               |
// ============================================================

import type { Request, Response } from "express";
import { STATI, STATO_DEFAULT, TIPI_CONTENUTO } from "../config/progetto.config";
import Contenuto from "../models/Contenuto";
import Lista from "../models/Lista";
import Commento from "../models/Commento";
import Valutazione from "../models/Valutazione";
import * as catalogo from "../services/catalogo.service";
import { AppError } from "../utils/AppError";
import { trovaMio } from "../utils/proprieta";
import { ok } from "../utils/risposta";
import { idUtente } from "../utils/utente";
import { campiObbligatori, isObjectId, leggiPaginazione, numeroTra, valoreAmmesso } from "../utils/validazione";

// Ordinamenti ammessi per ?ordina=  (lista chiusa: il client non può ordinare per campi a caso)
const ORDINAMENTI: Record<string, Record<string, 1 | -1>> = {
    recenti: { createdAt: -1 },
    vecchi: { createdAt: 1 },
    titolo: { titolo: 1 },
    anno: { anno: -1 },
};

// Rende sicura una stringa da usare dentro una RegExp (es. "c++" non rompe la ricerca)
function escapeRegex(testo: string) {
    return testo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ------------------------------------------------------------
// POST /api/libri      body: { idEsterno, stato?, listaId? }
// ------------------------------------------------------------
// Il client manda SOLO l'id Open Library (es. "OL45804W"): titolo, copertina
// ecc. li prendiamo noi dall'API. Così i dati salvati sono sempre corretti
// (il client non può inventarsi un titolo) e verifichiamo che il libro esista.
export async function salva(req: Request, res: Response) {
    campiObbligatori(req.body, ["idEsterno"]);
    const userId = idUtente(req);
    // "tipo" non è obbligatorio: in BookTrack esiste solo "book"
    const tipo = valoreAmmesso(req.body.tipo ?? TIPI_CONTENUTO[0], TIPI_CONTENUTO, "tipo");
    const idEsterno = String(req.body.idEsterno).trim();
    const stato = req.body.stato !== undefined ? valoreAmmesso(req.body.stato, STATI, "stato") : STATO_DEFAULT;

    // 1. Dati dall'API (se non esiste -> l'API risponde 404 -> AppError 404)
    const dati = await catalogo.dettaglio(idEsterno, tipo);

    // 2. Già salvato? -> 409 (messaggio chiaro; l'indice unico farebbe comunque 409)
    const esiste = await Contenuto.exists({ user: userId, fonte: dati.fonte, tipo, idEsterno: dati.idEsterno });
    if (esiste) {
        throw new AppError("Libro già salvato", 409);
    }

    // 3. Salvataggio. NON salviamo "dati.dettagli": si chiedono all'API quando servono.
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

    // 4. Aggiunta diretta a uno scaffale ("salva e metti in Da leggere")
    if (req.body.listaId) {
        if (!isObjectId(req.body.listaId)) throw new AppError("listaId non valido", 400);
        await trovaMio(Lista, req.body.listaId, userId, "Scaffale");
        await Lista.updateOne({ _id: req.body.listaId, user: userId }, { $addToSet: { contenuti: contenuto._id } });
    }

    return ok(res, contenuto, 201);
}

// ------------------------------------------------------------
// GET /api/libri?stato=&q=&ordina=&pagina=&limite=
// ------------------------------------------------------------
// Tutti i filtri sono facoltativi. Esempi:
//   /api/libri?stato=in_lettura
//   /api/libri?ordina=titolo
//   /api/libri?q=harry&pagina=2&limite=5
export async function elenco(req: Request, res: Response) {
    const filtro: Record<string, unknown> = { user: idUtente(req) };

    if (req.query.stato) filtro.stato = valoreAmmesso(req.query.stato, STATI, "stato");
    if (req.query.q) {
        // ricerca "contiene", senza distinguere maiuscole/minuscole
        filtro.titolo = { $regex: escapeRegex(String(req.query.q)), $options: "i" };
    }

    const ordina = ORDINAMENTI[String(req.query.ordina ?? "recenti")] ?? ORDINAMENTI.recenti;
    const { pagina, limite, skip } = leggiPaginazione(req.query);

    // Le due query partono insieme (Promise.all) invece che una dopo l'altra
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

// ------------------------------------------------------------
// GET /api/libri/statistiche
// ------------------------------------------------------------
// Esempio di aggregazione MongoDB: quanti libri per stato
// e la media dei voti dati dall'utente.
// Risposta: { totale, perStato: { letto: 3, da_leggere: 5 }, voti: { numero, media } }
export async function statistiche(req: Request, res: Response) {
    const userId = idUtente(req);

    const [perStato, voti] = await Promise.all([
        Contenuto.aggregate([{ $match: { user: userId } }, { $group: { _id: "$stato", totale: { $sum: 1 } } }]),
        Valutazione.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, media: { $avg: "$voto" }, numero: { $sum: 1 } } },
        ]),
    ]);

    // Trasforma [{ _id: "letto", totale: 3 }] in { letto: 3 }
    const inOggetto = (righe: any[]) => Object.fromEntries(righe.map((r) => [r._id, r.totale]));

    return ok(res, {
        totale: perStato.reduce((somma, r) => somma + r.totale, 0),
        perStato: inOggetto(perStato),
        voti: {
            numero: voti[0]?.numero ?? 0,
            media: voti[0] ? Math.round(voti[0].media * 10) / 10 : null,
        },
    });
}

// ------------------------------------------------------------
// GET /api/libri/:id            (?completo=true per i dati completi dall'API)
// ------------------------------------------------------------
export async function dettaglio(req: Request, res: Response) {
    const userId = idUtente(req);
    const contenuto = await trovaMio(Contenuto, req.params.id, userId, "Libro");

    // Valutazione personale (se c'è) insieme al libro
    const valutazione = await Valutazione.findOne({ user: userId, contenuto: contenuto._id }).select("voto updatedAt");

    const risposta: Record<string, unknown> = { ...contenuto.toObject(), valutazione };

    if (req.query.completo === "true") {
        const api = await catalogo.dettaglio(contenuto.idEsterno, contenuto.tipo);
        risposta.dettagli = api.dettagli;
    }

    return ok(res, risposta);
}

// ------------------------------------------------------------
// PATCH /api/libri/:id          body: { note?, pagine? }
// ------------------------------------------------------------
// Aggiorna SOLO i campi inviati e SOLO quelli ammessi (il client non può
// cambiare titolo, user, idEsterno...).
// "pagine" serve quando Open Library non conosce il numero di pagine.
export async function aggiorna(req: Request, res: Response) {
    const body = req.body ?? {};
    const modifiche: Record<string, unknown> = {};

    if (body.note !== undefined) modifiche.note = String(body.note);
    if (body.pagine !== undefined) {
        const pagine = numeroTra(body.pagine, 1, 100000, "pagine");
        if (!Number.isInteger(pagine)) throw new AppError('"pagine" deve essere un numero intero', 400);
        modifiche.pagine = pagine;
    }

    if (Object.keys(modifiche).length === 0) {
        throw new AppError("Nessun campo da aggiornare (ammessi: note, pagine)", 400);
    }

    // returnDocument: "after" -> restituisce il documento DOPO la modifica
    // (in Mongoose 9 sostituisce il vecchio { new: true })
    const contenuto = await Contenuto.findOneAndUpdate(
        { _id: req.params.id, user: idUtente(req) },
        modifiche,
        { returnDocument: "after", runValidators: true }
    );
    if (!contenuto) throw new AppError("Libro non trovato", 404);

    return ok(res, contenuto);
}

// ------------------------------------------------------------
// PATCH /api/libri/:id/stato    body: { stato }   (da_leggere | in_lettura | letto)
// ------------------------------------------------------------
// Segna il libro come "da leggere", "in lettura" o "letto".
// Piccola regola in più, per tenere coerente l'avanzamento:
//   - "da_leggere" -> la pagina corrente torna a 0
//   - "letto"      -> la pagina corrente diventa l'ultima (100%), se sappiamo le pagine
export async function aggiornaStato(req: Request, res: Response) {
    campiObbligatori(req.body, ["stato"]);
    const stato = valoreAmmesso(req.body.stato, STATI, "stato");

    const contenuto = await trovaMio(Contenuto, req.params.id, idUtente(req), "Libro");

    contenuto.stato = stato;
    if (stato === "da_leggere") contenuto.paginaCorrente = 0;
    if (stato === "letto" && contenuto.pagine) contenuto.paginaCorrente = contenuto.pagine;
    await contenuto.save();

    return ok(res, contenuto);
}

// ------------------------------------------------------------
// PATCH /api/libri/:id/progresso    body: { paginaCorrente }
// ------------------------------------------------------------
// Aggiorna la pagina a cui è arrivato l'utente e restituisce la percentuale.
// Si può fare solo per i libri "in lettura".
export async function aggiornaProgresso(req: Request, res: Response) {
    campiObbligatori(req.body, ["paginaCorrente"]);
    const contenuto = await trovaMio(Contenuto, req.params.id, idUtente(req), "Libro");

    if (contenuto.stato !== "in_lettura") {
        throw new AppError('Puoi aggiornare la pagina corrente solo dei libri "in_lettura"', 400);
    }

    // La pagina non può superare il numero di pagine del libro (se lo conosciamo)
    const massimo = contenuto.pagine ?? 100000;
    const paginaCorrente = numeroTra(req.body.paginaCorrente, 0, massimo, "paginaCorrente");
    if (!Number.isInteger(paginaCorrente)) throw new AppError('"paginaCorrente" deve essere un numero intero', 400);

    contenuto.paginaCorrente = paginaCorrente;
    await contenuto.save();

    // contenuto.percentuale è il campo calcolato del modello (null se non sappiamo le pagine)
    return ok(res, {
        paginaCorrente: contenuto.paginaCorrente,
        pagine: contenuto.pagine,
        percentuale: contenuto.percentuale,
        libro: contenuto,
    });
}

// ------------------------------------------------------------
// DELETE /api/libri/:id
// ------------------------------------------------------------
// Elimina il libro E tutto ciò che lo riguarda ("a cascata"):
// - lo toglie da tutti gli scaffali dell'utente ($pull)
// - cancella recensioni e valutazione collegate
export async function elimina(req: Request, res: Response) {
    const userId = idUtente(req);
    const contenuto = await Contenuto.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!contenuto) throw new AppError("Libro non trovato", 404);

    await Promise.all([
        Lista.updateMany({ user: userId }, { $pull: { contenuti: contenuto._id } }),
        Commento.deleteMany({ contenuto: contenuto._id }),
        Valutazione.deleteMany({ contenuto: contenuto._id }),
    ]);

    return ok(res, { messaggio: "Libro eliminato", id: contenuto._id });
}
