
// models/Shelf.ts

// qui salvo gli scaffali creati dall'utente
// lo stato del libro sta sul libro, non sullo scaffale


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
