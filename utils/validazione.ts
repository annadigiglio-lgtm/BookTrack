
// utils/validazione.ts  –  usato da TUTTI

// Piccole funzioni per controllare body, query e params.
// Se il controllo fallisce LANCIANO un AppError 400, quindi nel controller
// basta chiamarle: se si arriva alla riga dopo, i dati sono validi.
//
//     campiObbligatori(req.body, ["email", "password"]);
//     const stato = valoreAmmesso(req.body.stato, STATI, "stato");
//
// Così non servono pacchetti esterni (express-validator, zod...).

import mongoose from "mongoose";
import { AppError } from "./AppError";
import { LIMITE_DEFAULT, LIMITE_MAX } from "../config/progetto.config";

// Controlla che nel body ci siano tutti i campi (e che non siano stringhe vuote).
export function campiObbligatori(body: any, campi: string[]): void {
    const dati = body ?? {}; // con Express 5, senza body req.body è undefined
    const mancanti = campi.filter((campo) => {
        const valore = dati[campo];
        return valore === undefined || valore === null || String(valore).trim() === "";
    });
    if (mancanti.length > 0) {
        throw new AppError(`Campi obbligatori mancanti: ${mancanti.join(", ")}`, 400);
    }
}

// Controlla che "valore" sia uno di quelli ammessi (es. uno degli STATI).
// Restituisce il valore già "tipizzato", così si può usare direttamente.
export function valoreAmmesso<T extends string>(valore: unknown, ammessi: readonly T[], nomeCampo: string): T {
    if (typeof valore !== "string" || !ammessi.includes(valore as T)) {
        throw new AppError(`Valore non valido per "${nomeCampo}". Valori ammessi: ${ammessi.join(", ")}`, 400);
    }
    return valore as T;
}

// Controlla che sia un numero (anche se arriva come stringa "7") tra min e max.
export function numeroTra(valore: unknown, min: number, max: number, nomeCampo: string): number {
    const numero = Number(valore);
    if (valore === undefined || valore === null || valore === "" || Number.isNaN(numero) || numero < min || numero > max) {
        throw new AppError(`"${nomeCampo}" deve essere un numero tra ${min} e ${max}`, 400);
    }
    return numero;
}

// Controllo semplice del formato email (non perfetto, ma basta per la verifica).
export function emailValida(email: unknown): boolean {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// true se la stringa è un _id di MongoDB valido (24 caratteri esadecimali).
export function isObjectId(id: unknown): boolean {
    return typeof id === "string" && mongoose.isValidObjectId(id);
}

// Legge ?pagina=2&limite=10 dalla query string e calcola lo "skip" per MongoDB.
// Valori assurdi (negativi, enormi, lettere) vengono corretti.
export function leggiPaginazione(query: any) {
    const pagina = Math.max(1, Number.parseInt(query?.pagina, 10) || 1);
    const limite = Math.min(LIMITE_MAX, Math.max(1, Number.parseInt(query?.limite, 10) || LIMITE_DEFAULT));
    return { pagina, limite, skip: (pagina - 1) * limite };
}
