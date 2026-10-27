// ============================================================
// app.ts
// ============================================================
// Configura l'app Express (NON la avvia: lo fa index.ts).
// Separarli permette di importare l'app nei test senza accendere il server.
//
// ⚠️ L'ORDINE degli app.use CONTA:
//   1. express.json()        -> legge il body JSON (senza: req.body è undefined)
//   2. passport.initialize() -> attiva Passport (strategia in config/passport.config.ts)
//   3. log delle richieste   -> utile per capire cosa arriva
//   4. rotte /api
//   5. notFound              -> 404 per le rotte che non esistono
//   6. gestoreErrori         -> SEMPRE PER ULTIMO
// ============================================================

import express from "express";
import passport from "./config/passport.config"; // importarlo registra la strategia JWT
import routes from "./routes";
import { notFound, gestoreErrori } from "./middleware/error.middleware";

const app = express();

// 1. Body JSON (limite di dimensione per sicurezza)
app.use(express.json({ limit: "100kb" }));

// 2. Passport
app.use(passport.initialize());

// 3. Log semplice di ogni richiesta (metodo, URL, status, tempo)
app.use((req, res, next) => {
    const inizio = Date.now();
    res.on("finish", () => {
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inizio} ms)`);
    });
    next();
});

// 4. Rotte
app.use("/api", routes);

// 5. e 6. Errori (sempre in fondo)
app.use(notFound);
app.use(gestoreErrori);

export default app;
