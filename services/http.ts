// ============================================================
// services/http.ts
// ============================================================
// Due funzioni che servono a OGNI integrazione con un'API esterna:
//
// 1. costruisciUrl(base, percorso, parametri)
//    Crea l'URL con la query string, codificando i caratteri speciali
//    (spazi, accenti, &...). Evita errori tipo "?query=il signore degli anelli".
//    I parametri vuoti/undefined vengono saltati.
//
// 2. chiamaApi(url, nomeServizio, headers)
//    Fa la fetch (già inclusa in Bun, non serve axios) e traduce gli errori
//    dell'API esterna in AppError con lo status giusto per il NOSTRO client:
//      404 dall'API          -> 404 "Contenuto non trovato"
//      401/403 dall'API      -> 502 (è un problema NOSTRO di chiave, non del client)
//      429 dall'API          -> 503 troppe richieste
//      altri errori          -> 502 Bad Gateway
//      nessuna risposta      -> 504 timeout / 502
// ============================================================

import { AppError } from "../utils/AppError";

export function costruisciUrl(base: string, percorso: string, parametri: Record<string, unknown> = {}): string {
    // Evita doppi o mancanti "/" tra base e percorso
    const url = new URL(base.replace(/\/+$/, "") + "/" + percorso.replace(/^\/+/, ""));
    for (const [chiave, valore] of Object.entries(parametri)) {
        if (valore !== undefined && valore !== null && valore !== "") {
            url.searchParams.set(chiave, String(valore));
        }
    }
    return url.toString();
}

export async function chiamaApi(url: string, nomeServizio: string, headers: Record<string, string> = {}): Promise<any> {
    let risposta: Response;
    try {
        risposta = await fetch(url, {
            headers: { Accept: "application/json", ...headers },
            signal: AbortSignal.timeout(8000), // dopo 8 secondi rinunciamo
        });
    } catch (err: any) {
        if (err?.name === "TimeoutError") {
            throw new AppError(`${nomeServizio} non risponde (timeout)`, 504);
        }
        throw new AppError(`Impossibile contattare ${nomeServizio}`, 502);
    }

    if (risposta.ok) {
        return risposta.json();
    }

    // Utile in console per capire cosa ha risposto l'API (NON lo mandiamo al client)
    console.warn(`⚠️  ${nomeServizio} ha risposto ${risposta.status} per ${url.replace(/(api_key|key)=[^&]+/g, "$1=***")}`);

    if (risposta.status === 404) throw new AppError("Contenuto non trovato", 404);
    if (risposta.status === 401 || risposta.status === 403) {
        throw new AppError(`${nomeServizio}: chiave API mancante o non valida (controllate il .env)`, 502);
    }
    if (risposta.status === 429) throw new AppError(`${nomeServizio}: troppe richieste, riprova tra poco`, 503);
    throw new AppError(`Errore dal servizio ${nomeServizio} (status ${risposta.status})`, 502);
}
