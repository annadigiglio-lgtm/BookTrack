
// routes/lista.routes.ts

// qui ci sono gli scaffali dell'utente
// tutte le rotte sono protette

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
