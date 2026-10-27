// ============================================================
// config/passport.config.ts
// ============================================================
// Configura Passport.js con la strategia JWT (Bearer Token).
// Basta importare questo file una volta (lo fa app.ts) e la strategia
// "jwt" è disponibile per passport.authenticate("jwt", ...).
//
// Come funziona, per ogni richiesta su una rotta protetta:
//   1. legge l'header   Authorization: Bearer <token>
//   2. verifica firma e scadenza con JWT_SECRET (lo fa passport-jwt da solo)
//   3. chiama la nostra funzione qui sotto con il payload decodificato
//   4. noi cerchiamo l'utente e controlliamo che il token sia ancora quello
//      salvato (se ha fatto logout, nel DB c'è null -> rifiutato)
//   5. done(null, utente) -> l'utente finisce in req.user
//
// Il payload del token lo creiamo noi al login: { id: user._id }
// (vedi controllers/auth.controller.ts). Deve combaciare con payload.id qui.
// ============================================================

import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { env } from "./env.config";
import User from "../models/User";

const estraiToken = ExtractJwt.fromAuthHeaderAsBearerToken();

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: estraiToken,
            secretOrKey: env.jwtSecret,
            algorithms: ["HS256"],     // accettiamo solo l'algoritmo che usiamo per firmare
            passReqToCallback: true,   // ci serve "req" per rileggere il token (controllo logout)
        },
        async (req: any, payload: any, done: any) => {
            try {
                // "+token": il campo ha select:false, quindi va chiesto esplicitamente
                const utente = await User.findById(payload.id).select("+token");
                if (!utente) {
                    return done(null, false, { message: "Utente non più esistente" });
                }

                // LOGOUT: il token della richiesta deve essere quello salvato al login.
                // Dopo il logout nel DB c'è null -> il vecchio token non vale più.
                if (!utente.token || utente.token !== estraiToken(req)) {
                    return done(null, false, { message: "Sessione non valida: effettua di nuovo il login" });
                }

                return done(null, utente);
            } catch (errore) {
                return done(errore, false);
            }
        }
    )
);

export default passport;
