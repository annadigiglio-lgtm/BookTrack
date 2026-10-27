
// utils/proprieta.ts  –  usato da TUTTI

// "Ogni utente può gestire SOLO i propri dati" (requisito di entrambe le prove).
//
// Il trucco: cercare SEMPRE per _id E user insieme:
//     Model.findOne({ _id: id, user: userId })
// Se il documento è di un altro utente, la query non lo trova -> 404.
// (404 e non 403: così non diciamo nemmeno che quell'id esiste.)
//
// Questa funzione fa proprio questo e lancia l'errore se non trova nulla:
//     const lista = await trovaMio(Lista, req.params.id, idUtente(req), "Lista");


import type { Model } from "mongoose";
import { AppError } from "./AppError";

export async function trovaMio(modello: Model<any>, id: unknown, userId: unknown, nome = "Elemento") {
    const documento = await modello.findOne({ _id: id, user: userId });
    if (!documento) {
        throw new AppError(`${nome} non trovato`, 404);
    }
    return documento;
}
