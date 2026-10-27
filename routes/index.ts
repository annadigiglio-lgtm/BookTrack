
// routes/index.ts

// qui monto tutte le rotte dell'api
// app.ts usa questo router sotto /api


import { Router } from "express";
import authRoutes from "./auth.routes";
import ricercaRoutes from "./search.routes";
import contenutoRoutes from "./content.routes";
import listaRoutes from "./shelf.routes";
import commentoRoutes from "./comment.routes";

const router = Router();

// check veloce per vedere se il server è vivo
router.get("/health", (_req, res) => {
    res.json({ success: true, data: { stato: "ok", ora: new Date().toISOString() } });
});

router.use("/auth", authRoutes);          // login, registrazione e profilo
router.use("/ricerca", ricercaRoutes);    // cerca libri fuori
router.use("/libri", contenutoRoutes);    // libri salvati dell'utente
router.use("/scaffali", listaRoutes);     // scaffali personali
router.use("/commenti", commentoRoutes);  // modifica e cancella recensioni

export default router;
