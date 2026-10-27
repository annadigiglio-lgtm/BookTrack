
// routes/contenuto.routes.ts

// qui stanno i libri salvati dall'utente
// tutte le rotte sono protette
//
// /statistiche va prima di /:id, altrimenti Express la legge come id


import { Router } from "express";
import { autentica } from "../middleware/auth.middleware";
import { validaId } from "../middleware/validaId.middleware";
import { salva, elenco, statistiche, dettaglio, aggiorna, aggiornaStato, aggiornaProgresso, elimina } from "../controllers/contenuto.controller";
import { commentiDelContenuto } from "./commento.routes";
import valutazioneRoutes from "./valutazione.routes";

const router = Router();

router.use(autentica);

router.post("/", salva);
router.get("/", elenco);
router.get("/statistiche", statistiche);

router.get("/:id", validaId("id"), dettaglio);
router.patch("/:id", validaId("id"), aggiorna);
router.patch("/:id/stato", validaId("id"), aggiornaStato);
router.patch("/:id/progresso", validaId("id"), aggiornaProgresso);
router.delete("/:id", validaId("id"), elimina);

// sotto-rotte per commenti e valutazione del libro
router.use("/:contenutoId/commenti", validaId("contenutoId"), commentiDelContenuto);
router.use("/:contenutoId/valutazione", validaId("contenutoId"), valutazioneRoutes);

export default router;
