// i libri che l'utente ha aggiunto alla sua lista
// ogni utente può avere lo stesso libro più volte, ma con profilo diverso


import mongoose, { Schema } from "mongoose";
import { TIPI_CONTENUTO, STATI, STATO_DEFAULT } from "../config/progetto.config";

const contenutoSchema = new Schema(
    {
        // Di chi è (OBBLIGATORIO: è quello che garantisce che ogni utente veda solo i suoi)
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

        // Da dove arriva: "openlibrary" (lo imposta il service)
        fonte: { type: String, required: true },
        // Id del libro su Open Library, es. "OL45804W"
        idEsterno: { type: String, required: true },
        // "book" (valori presi da config/progetto.config.ts)
        tipo: { type: String, enum: [...TIPI_CONTENUTO], required: true },

        // Dati "di vetrina" copiati dall'API al momento del salvataggio
        titolo: { type: String, required: true, trim: true },
        descrizione: { type: String, default: "" },
        immagine: { type: String, default: null },
        anno: { type: Number, default: null },
        // Campi specifici dell'API (autori, generi, isbn...).
        // "Mixed" = oggetto libero, così non serve cambiare lo schema.
        extra: { type: Schema.Types.Mixed, default: {} },

        // Numero di pagine del libro (null se Open Library non lo conosce:
        // in quel caso l'utente può scriverlo con PATCH /api/libri/:id)
        pagine: { type: Number, default: null, min: 1 },

        // Dati PERSONALI dell'utente
        // da_leggere / in_lettura / letto
        stato: { type: String, enum: [...STATI], default: STATO_DEFAULT },
        // Pagina a cui è arrivato (per i libri "in lettura")
        paginaCorrente: { type: Number, default: 0, min: 0 },
        // Una nota libera dell'utente
        note: { type: String, default: "", trim: true },
    },
    {
        timestamps: true,
        // Con queste opzioni i campi "virtuali" (come "percentuale") compaiono nel JSON
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false, // niente campo "id" duplicato di "_id"
    }
);

contenutoSchema.virtual("percentuale").get(function () {
    if (!this.pagine) return null;
    return Math.round(((this.paginaCorrente ?? 0) / this.pagine) * 100);
});

// Lo stesso utente non può salvare due volte lo stesso contenuto.
// Se ci prova, MongoDB dà errore 11000 -> l'error middleware risponde 409.
contenutoSchema.index({ user: 1, fonte: 1, tipo: 1, idEsterno: 1 }, { unique: true });

const Contenuto = mongoose.model("Contenuto", contenutoSchema);
export default Contenuto;
