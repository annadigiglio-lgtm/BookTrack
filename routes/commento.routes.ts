
// routes/commento.routes.ts

// qui ci sono le due parti dei commenti
// una sotto /api/libri/:contenutoId/commenti
// l'altra sotto /api/commenti


import { Router } from "express";
import { autentica } from "../middleware/auth.middleware";
import { validaId } from "../middleware/validaId.middleware";
import { getComments, createComment, updateComment, deleteComment } from "../controllers/commento.controller";

// 1. /api/libri/:contenutoId/commenti
export const commentiDelContenuto = Router({ mergeParams: true });
commentiDelContenuto.get("/", getComments);
commentiDelContenuto.post("/", createComment);

// 2. /api/commenti
const router = Router();
router.use(autentica);
router.patch("/:id", validaId("id"), updateComment);
router.delete("/:id", validaId("id"), deleteComment);

export default router;
