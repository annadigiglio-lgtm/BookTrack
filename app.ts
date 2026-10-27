
// app.ts

// qui preparo l'app Express ma non la avvio
// così posso importarla nei test senza accendere il server
//
// ordine importante per i middleware
// 1. leggo il body JSON
// 2. attivo Passport
// 3. loggo le richieste
// 4. metto le rotte /api
// 5. gestisco 404
// 6. metto il gestore errori in fondo


import express from "express";
import passport from "./config/passport.config"; // mi serve per registrare la strategia JWT
import routes from "./routes";
import { notFound, gestoreErrori } from "./middleware/error.middleware";

const app = express();

// leggo il body JSON con un limite sicuro
app.use(express.json({ limit: "100kb" }));

// attivo Passport
app.use(passport.initialize());

// registro un log semplice per ogni richiesta
app.use((req, res, next) => {
    const inizio = Date.now();
    res.on("finish", () => {
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inizio} ms)`);
    });
    next();
});

// metto le rotte
app.use("/api", routes);

// 404 e errori vanno sempre in fondo
app.use(notFound);
app.use(gestoreErrori);

export default app;
