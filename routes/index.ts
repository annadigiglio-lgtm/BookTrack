// ============================================================
// routes/index.ts  –  Router principale: raccoglie tutti gli altri
// ============================================================
// In app.ts basta   app.use("/api", routes)
// Mappa completa delle rotte: vedi README.md
// ============================================================

import { Router } from "express";
import authRoutes from "./auth.routes";
import ricercaRoutes from "./ricerca.routes";
import contenutoRoutes from "./contenuto.routes";
import listaRoutes from "./lista.routes";
import commentoRoutes from "./commento.routes";

const router = Router();

// Controllo veloce che il server sia acceso: GET /api/health
router.get("/health", (_req, res) => {
    res.json({ success: true, data: { stato: "ok", ora: new Date().toISOString() } });
});

router.use("/auth", authRoutes);          // registrazione, login, logout
router.use("/ricerca", ricercaRoutes);    // ricerca su Open Library
router.use("/libri", contenutoRoutes);    // libri salvati (+ recensioni e valutazione annidate)
router.use("/scaffali", listaRoutes);     // scaffali personali
router.use("/commenti", commentoRoutes);  // modifica/eliminazione recensioni

export default router;
