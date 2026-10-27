
// routes/commento.routes.ts

// qui ci sono le due parti dei commenti
// una sotto /api/libri/:contenutoId/commenti
// l'altra sotto /api/commenti


import { Router } from "express";
import { autentica } from "../middleware/auth.middleware";
import { validaId } from "../middleware/validaId.middleware";
import { elenco, crea, aggiorna, elimina } from "../controllers/commento.controller";

// 1. /api/libri/:contenutoId/commenti
export const commentiDelContenuto = Router({ mergeParams: true });
commentiDelContenuto.get("/", elenco);
commentiDelContenuto.post("/", crea);

// 2. /api/commenti
const router = Router();
router.use(autentica);
router.patch("/:id", validaId("id"), aggiorna);
router.delete("/:id", validaId("id"), elimina);

export default router;
