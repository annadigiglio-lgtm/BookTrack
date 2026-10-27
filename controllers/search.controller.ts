// controllers/search.controller.ts
// client chiama il nostro server, poi noi chiamiamo l'API esterna

import type { Request, Response } from "express";
import { TIPI_CONTENUTO } from "../config/project.config";
import Contenuto from "../models/Content";
import * as catalogo from "../services/catalog.service";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { allowedValue } from "../utils/validation";


// GET /api/ricerca?q=...&tipo=...&pagina=...

export async function search(req: Request, res: Response) {
    // accetto anche query= oltre a q, così funziona con richieste diverse
    const q = String(req.query.q ?? req.query.query ?? "").trim();
    if (!q) {
        throw new AppError('Parametro "q" obbligatorio (es. /api/ricerca?q=batman)', 400);
    }

    // se non arriva il tipo, uso il primo che abbiamo configurato
    const tipo = allowedValue(req.query.tipo ?? TIPI_CONTENUTO[0], TIPI_CONTENUTO, "tipo");
    const pagina = Math.max(1, Number.parseInt(String(req.query.pagina ?? "1"), 10) || 1);

    const opzioni: Record<string, string> = {};
    if (req.query.campo) opzioni.campo = String(req.query.campo);

    const risultato = await catalogo.search(q, tipo, pagina, opzioni);
    return ok(res, risultato);
}


// GET /api/ricerca/:tipo/:idEsterno

// restituisco anche se il libro è già stato salvato dall'utente
export async function getDetails(req: Request, res: Response) {
    const tipo = allowedValue(req.params.tipo, TIPI_CONTENUTO, "tipo");
    const idEsterno = String(req.params.idEsterno);

    const risultato = await catalogo.getDetails(idEsterno, tipo);

    const userId = (req.user as any)?._id;
    const giaSalvato = await Contenuto.findOne({ user: userId, fonte: risultato.fonte, tipo, idEsterno }).select("_id stato");

    return ok(res, { ...risultato, salvato: giaSalvato });
}

