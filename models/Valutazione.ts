// ============================================================
// models/Valutazione.ts
// ============================================================
// Il voto PERSONALE (da 1 a 5) di un utente su un suo libro salvato.
// UNA sola valutazione per utente per libro (indice unico):
// se l'utente vota di nuovo, la valutazione si AGGIORNA (upsert nel controller).
//
// ⚠️ Non confondere con il voto medio di Open Library: quello si mostra
//    solo nel dettaglio, non si salva qui.
// ============================================================

import mongoose, { Schema } from "mongoose";
import { VOTO_MIN, VOTO_MAX } from "../config/progetto.config";

const valutazioneSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        contenuto: { type: Schema.Types.ObjectId, ref: "Contenuto", required: true },
        voto: { type: Number, required: true, min: VOTO_MIN, max: VOTO_MAX },
    },
    { timestamps: true }
);

valutazioneSchema.index({ user: 1, contenuto: 1 }, { unique: true });

const Valutazione = mongoose.model("Valutazione", valutazioneSchema);
export default Valutazione;
