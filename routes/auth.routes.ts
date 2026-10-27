// ============================================================
// routes/auth.routes.ts
// ============================================================
// Montato su /api/auth (vedi routes/index.ts).
//
// | Metodo | URL        | Protetta | Controller  |
// |--------|------------|----------|-------------|
// | POST   | /register  | no       | register    |
// | POST   | /login     | no       | login       |
// | POST   | /logout    | sì       | logout      |
// | GET    | /me        | sì       | me          |
// | PATCH  | /me        | sì       | aggiornaMe  |
// | DELETE | /me        | sì       | eliminaMe   |
// ============================================================

import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { autentica } from "../middleware/auth.middleware";
import { register, login, logout, me, aggiornaMe, eliminaMe } from "../controllers/auth.controller";

const router = Router();

// Sicurezza: massimo 10 tentativi di login
// ogni 15 minuti per IP, contro chi prova password a raffica (brute force).
// Se durante i test vi blocca, alzate "limit" o togliete limiteLogin dalla rotta.
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, error: { message: "Troppi tentativi di login, riprova tra 15 minuti", status: 429 } },
});

// Pubbliche
router.post("/register", register);
router.post("/login", limiteLogin, login);

// Protette
router.post("/logout", autentica, logout);
router.get("/me", autentica, me);
router.patch("/me", autentica, aggiornaMe);
router.delete("/me", autentica, eliminaMe);

export default router;
