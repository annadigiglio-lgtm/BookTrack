// ============================================================
// routes/contenuto.routes.ts  –  I libri salvati dall'utente
// ============================================================
// Montato su /api/libri. Tutte PROTETTE.
//
// | Metodo | URL                              | Controller                  |
// |--------|----------------------------------|-----------------------------|
// | POST   | /                                | salva                       |
// | GET    | /                                | elenco                      |
// | GET    | /statistiche                     | statistiche                 |
// | GET    | /:id                             | dettaglio                   |
// | PATCH  | /:id                             | aggiorna                    |
// | PATCH  | /:id/stato                       | aggiornaStato               |
// | PATCH  | /:id/progresso                   | aggiornaProgresso           |
// | DELETE | /:id                             | elimina                     |
// |  ...   | /:contenutoId/commenti           | -> routes/commento.routes   |
// |  ...   | /:contenutoId/valutazione        | -> routes/valutazione.routes|
//
// ⚠️ ORDINE: "/statistiche" PRIMA di "/:id", altrimenti Express pensa
//    che "statistiche" sia un id (e validaId risponde 400).
// ============================================================

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

// Sotto-rotte: recensioni (commenti) e valutazione del libro
router.use("/:contenutoId/commenti", validaId("contenutoId"), commentiDelContenuto);
router.use("/:contenutoId/valutazione", validaId("contenutoId"), valutazioneRoutes);

export default router;
