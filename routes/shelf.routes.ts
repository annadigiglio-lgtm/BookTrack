
// routes/shelf.routes.ts

// qui ci sono gli scaffali dell'utente
// tutte le rotte sono protette

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateIds } from "../middleware/idValidation.middleware";
import { create, getAll, getDetails, update, deleteList, addContent, removeContent, moveContent } from "../controllers/shelf.controller";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", validateIds("id"), getDetails);
router.patch("/:id", validateIds("id"), update);
router.delete("/:id", validateIds("id"), deleteList);
router.post("/:id/libri", validateIds("id"), addContent);
router.delete("/:id/libri/:contenutoId", validateIds("id", "contenutoId"), removeContent);
router.post("/:id/libri/:contenutoId/sposta", validateIds("id", "contenutoId"), moveContent);

export default router;
