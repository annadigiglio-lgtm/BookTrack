
// routes/content.routes.ts

// qui stanno i libri salvati dall'utente
// tutte le rotte sono protette
//
// /statistiche va prima di /:id, altrimenti Express la legge come id


import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateIds } from "../middleware/idValidation.middleware";
import { save, getAll, getStatistics, getDetails, update, updateStatus, updateProgress, deleteContent } from "../controllers/content.controller";
import { commentiDelContenuto } from "./comment.routes";
import valutazioneRoutes from "./rating.routes";

const router = Router();

router.use(authenticate);

router.post("/", save);
router.get("/", getAll);
router.get("/statistiche", getStatistics);

router.get("/:id", validateIds("id"), getDetails);
router.patch("/:id", validateIds("id"), update);
router.patch("/:id/stato", validateIds("id"), updateStatus);
router.patch("/:id/progresso", validateIds("id"), updateProgress);
router.delete("/:id", validateIds("id"), deleteContent);

// sotto-rotte per commenti e valutazione del libro
router.use("/:contenutoId/commenti", validateIds("contenutoId"), commentiDelContenuto);
router.use("/:contenutoId/valutazione", validateIds("contenutoId"), valutazioneRoutes);

export default router;
