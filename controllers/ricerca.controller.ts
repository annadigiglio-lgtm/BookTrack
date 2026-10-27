// ============================================================
// controllers/ricerca.controller.ts
// ============================================================
// Il client chiama il NOSTRO server, e il nostro server chiama l'API esterna
// (così la chiave API resta segreta sul server).
//
// | Funzione   | Rotta                                 | Esempio                                   |
// |------------|---------------------------------------|-------------------------------------------|
// | cerca      | GET /api/ricerca                      | /api/ricerca?q=dune&pagina=1               |
// | dettaglio  | GET /api/ricerca/:tipo/:idEsterno     | /api/ricerca/book/OL45804W                 |
//
// Ricerca per titolo, autore o ISBN: ?campo=titolo|autore|isbn
//   /api/ricerca?q=tolkien&campo=autore
//   /api/ricerca?q=9780441172719&campo=isbn
// ============================================================

import type { Request, Response } from "express";
import { TIPI_CONTENUTO } from "../config/progetto.config";
import Contenuto from "../models/Contenuto";
import * as catalogo from "../services/catalogo.service";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/risposta";
import { valoreAmmesso } from "../utils/validazione";

// ------------------------------------------------------------
// GET /api/ricerca?q=...&tipo=...&pagina=...
// ------------------------------------------------------------
export async function cerca(req: Request, res: Response) {
    // Accettiamo sia ?q= che ?query= (non si sa mai cosa scrive il docente in Postman)
    const q = String(req.query.q ?? req.query.query ?? "").trim();
    if (!q) {
        throw new AppError('Parametro "q" obbligatorio (es. /api/ricerca?q=batman)', 400);
    }

    // Il tipo è facoltativo: se non c'è usiamo il primo di TIPI_CONTENUTO ("book")
    const tipo = valoreAmmesso(req.query.tipo ?? TIPI_CONTENUTO[0], TIPI_CONTENUTO, "tipo");
    const pagina = Math.max(1, Number.parseInt(String(req.query.pagina ?? "1"), 10) || 1);

    const opzioni: Record<string, string> = {};
    if (req.query.campo) opzioni.campo = String(req.query.campo);

    const risultato = await catalogo.cerca(q, tipo, pagina, opzioni);
    return ok(res, risultato);
}

// ------------------------------------------------------------
// GET /api/ricerca/:tipo/:idEsterno
// ------------------------------------------------------------
// Restituisce il dettaglio completo del libro (titolo, autori, anno, pagine,
// generi, copertina...) e in più "salvato": l'_id del libro se l'utente
// l'ha già salvato (il client sa se mostrare "Salva" o "Già salvato").
export async function dettaglio(req: Request, res: Response) {
    const tipo = valoreAmmesso(req.params.tipo, TIPI_CONTENUTO, "tipo");
    const idEsterno = String(req.params.idEsterno);

    const risultato = await catalogo.dettaglio(idEsterno, tipo);

    const userId = (req.user as any)?._id;
    const giaSalvato = await Contenuto.findOne({ user: userId, fonte: risultato.fonte, tipo, idEsterno }).select("_id stato");

    return ok(res, { ...risultato, salvato: giaSalvato });
}
