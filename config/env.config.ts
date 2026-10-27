// ============================================================
// config/env.config.ts
// ============================================================
// Scopo: leggere TUTTE le variabili del .env in un solo posto.
// Gli altri file importano "env" da qui e non usano mai process.env
// direttamente. Vantaggi:
//   - se una variabile cambia nome, si modifica solo questo file
//   - i valori di default sono tutti qui
//   - le variabili obbligatorie vengono controllate all'avvio
//
// Bun legge il file .env da solo: non serve "dotenv".
// (Se usaste Node: import "dotenv/config" come prima riga di index.ts)
// ============================================================

// Legge una variabile obbligatoria: se manca, il server NON parte.
// Meglio un errore chiaro subito che token firmati con "undefined".
function obbligatoria(nome: string): string {
    const valore = process.env[nome];
    if (!valore) {
        throw new Error(`Variabile d'ambiente mancante: ${nome} (controllate il file .env)`);
    }
    return valore;
}

export const env = {
    port: Number(process.env.PORT) || 3000,

    // --- Database ---
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/booktrack",

    // --- JWT ---
    jwtSecret: obbligatoria("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",

    // --- Open Library (libri) ---
    // Non serve nessuna chiave API: è gratuita e libera.
    openLibrary: {
        baseUrl: process.env.OPENLIBRARY_BASE_URL || "https://openlibrary.org",
        coversUrl: process.env.OPENLIBRARY_COVERS_URL || "https://covers.openlibrary.org",
    },
};
