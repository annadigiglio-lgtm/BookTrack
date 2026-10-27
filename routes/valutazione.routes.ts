// ============================================================
// routes/valutazione.routes.ts
// ============================================================
// Montato in contenuto.routes.ts su /api/libri/:contenutoId/valutazione
// (autentica e validaId sono già applicati dal router padre).
//
// | Metodo | URL | Controller |
// |--------|-----|------------|
// | GET    | /   | leggi      |
// | PUT    | /   | imposta    |
// | DELETE | /   | elimina    |
//
// mergeParams: true -> per leggere req.params.contenutoId del router padre.
// ============================================================

import { Router } from "express";
import { leggi, imposta, elimina } from "../controllers/valutazione.controller";

const router = Router({ mergeParams: true });

router.get("/", leggi);
router.put("/", imposta);
router.delete("/", elimina);

export default router;
