
// routes/comment.routes.ts

// qui ci sono le due parti dei commenti
// una sotto /api/libri/:contenutoId/commenti
// l'altra sotto /api/commenti


import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateIds } from "../middleware/idValidation.middleware";
import { getComments, createComment, updateComment, deleteComment } from "../controllers/comment.controller";

// 1. /api/libri/:contenutoId/commenti
export const commentiDelContenuto = Router({ mergeParams: true });
commentiDelContenuto.get("/", getComments);
commentiDelContenuto.post("/", createComment);

// 2. /api/commenti
const router = Router();
router.use(authenticate);
router.patch("/:id", validateIds("id"), updateComment);
router.delete("/:id", validateIds("id"), deleteComment);

export default router;
