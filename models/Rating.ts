
// models/Rating.ts

// qui salvo la valutazione che l'utente dà a un suo libro
// per ogni libro c'è solo un voto per utente


import mongoose, { Schema } from "mongoose";
import { VOTO_MIN, VOTO_MAX } from "../config/project.config";

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
