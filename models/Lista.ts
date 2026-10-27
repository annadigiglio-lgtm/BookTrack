// ============================================================
// models/Lista.ts
// ============================================================
// Uno SCAFFALE personale con nome libero: "Da leggere", "In lettura",
// "Letti", "Fantasy"... Contiene dei libri SALVATI dall'utente.
//
// Lo "stato" di lettura (da_leggere / in_lettura / letto) sta sul libro,
// NON sullo scaffale: così l'utente può creare tutti gli scaffali che vuole.
// ============================================================

import mongoose, { Schema } from "mongoose";

const listaSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        nome: { type: String, required: true, trim: true },
        descrizione: { type: String, default: "", trim: true },
        // Array di riferimenti ai libri (Contenuto). Per avere i dati completi:
        // .populate("contenuti") nel controller.
        contenuti: [{ type: Schema.Types.ObjectId, ref: "Contenuto" }],
    },
    { timestamps: true }
);

// Lo stesso utente non può avere due liste con lo stesso nome (-> 409)
listaSchema.index({ user: 1, nome: 1 }, { unique: true });

const Lista = mongoose.model("Lista", listaSchema);
export default Lista;
