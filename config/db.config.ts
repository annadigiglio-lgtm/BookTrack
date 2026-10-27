// ============================================================
// config/db.config.ts
// ============================================================
// Scopo: collegarsi a MongoDB UNA volta, all'avvio.
// Viene chiamata da index.ts PRIMA di app.listen: se il DB non risponde,
// il server non parte (meglio di un server che risponde 500 a tutto).
//
// Non serve modificarlo il giorno della verifica: il nome del database
// si cambia nel .env (MONGO_URI).
// ============================================================

import mongoose from "mongoose";
import { env } from "./env.config";

export async function connectDB(): Promise<void> {
    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000, // dopo 5 secondi senza risposta -> errore
    });
    console.log(`✅ MongoDB connesso: ${mongoose.connection.name}`);
}
