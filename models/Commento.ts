// Una recensione (commento) di un utente su un suo libro salvato.
// Un libro può avere TANTE recensioni (a differenza della valutazione).


import mongoose, { Schema } from "mongoose";
import { COMMENTO_MAX } from "../config/progetto.config";

const commentoSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        contenuto: { type: Schema.Types.ObjectId, ref: "Contenuto", required: true, index: true },
        testo: { type: String, required: true, trim: true, maxlength: COMMENTO_MAX },
    },
    { timestamps: true } // createdAt = data del commento
);

const Commento = mongoose.model("Commento", commentoSchema);
export default Commento;
