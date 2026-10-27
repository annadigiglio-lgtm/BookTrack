// ============================================================
// utils/risposta.ts  –  usato da TUTTI
// ============================================================
// Formato UNICO delle risposte (deciso una volta, uguale per tutti):
//
//   successo ->  { "success": true,  "data": ... }
//   errore   ->  { "success": false, "error": { "message": "...", "status": 404 } }
//
// Gli errori li formatta middleware/error.middleware.ts.
// Le risposte di successo le mandiamo con questa funzione:
//
//     return ok(res, lista);          // 200
//     return ok(res, lista, 201);     // 201 Created
// ============================================================

import type { Response } from "express";

export function ok(res: Response, data: unknown, status = 200) {
    return res.status(status).json({ success: true, data });
}
