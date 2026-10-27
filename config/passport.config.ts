// ============================================================
// config/passport.config.ts
// ============================================================
// qui preparo la validazione JWT per le rotte protette
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
            algorithms: ["HS256"],     // uso solo l'algoritmo che firma i token
            passReqToCallback: true,   // mi serve req per controllare il logout
        },
        async (req: any, payload: any, done: any) => {
            try {
                // il campo token è nascosto, quindi lo chiedo esplicitamente
                const utente = await User.findById(payload.id).select("+token");
                if (!utente) {
                    return done(null, false, { message: "Utente non più esistente" });
                }

                // se è uscito, nel DB il token è null e questo vecchio token non vale più
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
