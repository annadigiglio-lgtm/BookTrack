
// routes/auth.routes.ts

// qui ci sono le rotte di login e profilo
// montate sotto /api/auth


import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../middleware/auth.middleware";
import { register, login, logout, me, updateMe, deleteMe } from "../controllers/auth.controller";

const router = Router();

// limito i tentativi di login per evitare brute force
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, error: { message: "Troppi tentativi di login, riprova tra 15 minuti", status: 429 } },
});

// pubbliche
router.post("/register", register);
router.post("/login", limiteLogin, login);

// protette
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateMe);
router.delete("/me", authenticate, deleteMe);

export default router;
