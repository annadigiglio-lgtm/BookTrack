// ============================================================
// models/User.ts
// ============================================================
// L'utente registrato.
//
// Campi:
// - nome      obbligatorio
// - email     obbligatoria, unica, salvata in minuscolo
// - password  SOLO l'hash (bcrypt). "select: false" = non esce mai nelle
//             query, a meno di chiederla con .select("+password") (vedi login)
// - token     il JWT attualmente valido. Serve per il LOGOUT "vero":
//             al logout si mette a null e Passport rifiuta il vecchio token
//             (vedi config/passport.config.ts).
//             Conseguenza: un nuovo login invalida il token precedente
//             (un utente = una sessione attiva). Per la verifica va benissimo.
// - ruolo     "utente" (default) o "admin" (vedi soloRuolo in middleware/auth.middleware.ts)
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
