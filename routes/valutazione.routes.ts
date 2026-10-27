// ============================================================
// routes/valutazione.routes.ts
// ============================================================
// qui gestisco la valutazione di un libro
// il router padre già controlla login e id
// ============================================================

import { Router } from "express";
import { leggi, imposta, elimina } from "../controllers/valutazione.controller";

const router = Router({ mergeParams: true });

router.get("/", leggi);
router.put("/", imposta);
router.delete("/", elimina);

export default router;
