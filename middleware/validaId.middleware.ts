// Controlla che i parametri dell'URL che sono _id di MongoDB siano validi
// PRIMA di arrivare al controller. Altrimenti risponde 400.
//
//     router.get("/:id", validaId("id"), getContenuto);
//     router.delete("/:id/contenuti/:contenutoId", validaId("id", "contenutoId"), ...);
//
// un CastError (che l'error middleware gestisce comunque come 400,


import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { isObjectId } from "../utils/validazione";

export function validaId(...nomiParametri: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        for (const nome of nomiParametri) {
            if (!isObjectId(req.params[nome])) {
                return next(new AppError(`Parametro "${nome}" non valido: deve essere un id MongoDB`, 400));
            }
        }
        next();
    };
}
