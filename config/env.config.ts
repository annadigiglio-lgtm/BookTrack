
// config/env.config.ts
// valori del .env


// prendo un valore obbligatorio e blocco il server se manca
function requireEnv(nome: string): string {
    const valore = process.env[nome];
    if (!valore) {
        throw new Error(`Variabile d'ambiente mancante: ${nome} (controllate il file .env)`);
    }
    return valore;
}

export const env = {
    port: Number(process.env.PORT) || 3000,

    // database
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/booktrack",

    // JWT
    jwtSecret: requireEnv("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",

    // Open Library
    // non serve chiave API
    openLibrary: {
        baseUrl: process.env.OPENLIBRARY_BASE_URL || "https://openlibrary.org",
        coversUrl: process.env.OPENLIBRARY_COVERS_URL || "https://covers.openlibrary.org",
    },
};
