// ============================================================
// models/User.ts
// ============================================================
// qui salvo i dati dell'utente
// password e token sono nascosti di default
// ============================================================

import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        nome: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        token: { type: String, default: null, select: false },
        ruolo: { type: String, enum: ["utente", "admin"], default: "utente" },
    },
    {
        timestamps: true, // aggiunge createdAt e updatedAt in automatico
        toJSON: {
            // Quando l'utente viene trasformato in JSON (res.json),
            // password e token vengono tolti SEMPRE, anche se per sbaglio
            // sono stati caricati. Così non escono mai nelle risposte.
            transform(_doc, ret: any) {
                delete ret.password;
                delete ret.token;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const User = mongoose.model("User", userSchema);
export default User;
