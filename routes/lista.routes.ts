// ============================================================
// routes/lista.routes.ts  –  Scaffali personali
// ============================================================
// Montato su /api/scaffali. Tutte PROTETTE.
//
// | Metodo | URL                                  | Controller         |
// |--------|--------------------------------------|--------------------|
// | POST   | /                                    | crea               |
// | GET    | /                                    | elenco             |
// | GET    | /:id                                 | dettaglio          |
// | PATCH  | /:id                                 | aggiorna           |
// | DELETE | /:id                                 | elimina            |
// | POST   | /:id/libri                           | aggiungiContenuto  |
// | DELETE | /:id/libri/:contenutoId              | rimuoviContenuto   |
// | POST   | /:id/libri/:contenutoId/sposta       | spostaContenuto    |
// ============================================================

import { Router } from "express";
import { autentica } from "../middleware/auth.middleware";
import { validaId } from "../middleware/validaId.middleware";
import { crea, elenco, dettaglio, aggiorna, elimina, aggiungiContenuto, rimuoviContenuto, spostaContenuto } from "../controllers/lista.controller";

const router = Router();

router.use(autentica);

router.post("/", crea);
router.get("/", elenco);
router.get("/:id", validaId("id"), dettaglio);
router.patch("/:id", validaId("id"), aggiorna);
router.delete("/:id", validaId("id"), elimina);
router.post("/:id/libri", validaId("id"), aggiungiContenuto);
router.delete("/:id/libri/:contenutoId", validaId("id", "contenutoId"), rimuoviContenuto);
router.post("/:id/libri/:contenutoId/sposta", validaId("id", "contenutoId"), spostaContenuto);

export default router;
