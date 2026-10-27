// ============================================================
// routes/commento.routes.ts
// ============================================================
// Due router in questo file:
//
// 1. commentiDelContenuto -> montato in contenuto.routes.ts su
//    /api/libri/:contenutoId/commenti
//    | GET  | /  | elenco |
//    | POST | /  | crea   |
//    "mergeParams: true" serve per leggere req.params.contenutoId,
//    che è definito nel router "padre".
//
// 2. default (commentoRoutes) -> montato in routes/index.ts su /api/commenti
//    | PATCH  | /:id | aggiorna |
//    | DELETE | /:id | elimina  |
// ============================================================

import { Router } from "express";
import { autentica } from "../middleware/auth.middleware";
import { validaId } from "../middleware/validaId.middleware";
import { elenco, crea, aggiorna, elimina } from "../controllers/commento.controller";

// 1. /api/libri/:contenutoId/commenti   (autentica è già nel router padre)
export const commentiDelContenuto = Router({ mergeParams: true });
commentiDelContenuto.get("/", elenco);
commentiDelContenuto.post("/", crea);

// 2. /api/commenti
const router = Router();
router.use(autentica);
router.patch("/:id", validaId("id"), aggiorna);
router.delete("/:id", validaId("id"), elimina);

export default router;
