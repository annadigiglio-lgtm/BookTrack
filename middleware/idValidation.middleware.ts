// Controlla che i parametri dell'URL che sono _id di MongoDB siano validi
// PRIMA di arrivare al controller. Altrimenti risponde 400.
//
//     router.get("/:id", validateIds("id"), getContenuto);
//     router.delete("/:id/contenuti/:contenutoId", validateIds("id", "contenutoId"), ...);
//
// un CastError (che l'error middleware gestisce comunque come 400,


import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { isValidObjectId } from "../utils/validation";

export function validateIds(...nomiParametri: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        for (const nome of nomiParametri) {
            if (!isValidObjectId(req.params[nome])) {
                return next(new AppError(`Parametro "${nome}" non valido: deve essere un id MongoDB`, 400));
            }
        }
        next();
    };
}
