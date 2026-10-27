// ============================================================
// routes/ricerca.routes.ts
// ============================================================
// Montato su /api/ricerca.
//
// | Metodo | URL                 | Query                                 | Controller |
// |--------|---------------------|---------------------------------------|------------|
// | GET    | /                   | ?q=&pagina=  (+ ?campo=titolo|autore|isbn) | cerca  |
// | GET    | /:tipo/:idEsterno   |                                       | dettaglio  |
//
// La ricerca è riservata agli utenti autenticati ("l'utente autenticato può cercare libri").
// ============================================================

import { Router } from "express";
import { autentica } from "../middleware/auth.middleware";
import { cerca, dettaglio } from "../controllers/ricerca.controller";

const router = Router();

router.use(autentica); // vale per tutte le rotte qui sotto

router.get("/", cerca);
router.get("/:tipo/:idEsterno", dettaglio);

export default router;
