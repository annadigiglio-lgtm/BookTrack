
// routes/search.routes.ts

// Montato su /api/ricerca.
//
// | Metodo | URL                 | Query                                 | Controller |
// |--------|---------------------|---------------------------------------|------------|
// | GET    | /                   | ?q=&pagina=  (+ ?campo=titolo|autore|isbn) | search  |
// | GET    | /:tipo/:idEsterno   |                                       | getDetails  |
//
// La ricerca è riservata agli utenti autenticati ("l'utente autenticato può cercare libri").


import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { search, getDetails } from "../controllers/search.controller";

const router = Router();

router.use(authenticate); // vale per tutte le rotte qui sotto

router.get("/", search);
router.get("/:tipo/:idEsterno", getDetails);

export default router;
