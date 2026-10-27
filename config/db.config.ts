
// config/db.config.ts

// qui mi connetto a MongoDB all'avvio

import mongoose from "mongoose";
import { env } from "./env.config";

export async function connectDB(): Promise<void> {
    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000, // se non risponde entro 5 secondi, faccio errore
    });
    console.log(`✅ MongoDB connesso: ${mongoose.connection.name}`);
}
