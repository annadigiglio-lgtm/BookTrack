
// services/http.ts

// due funzioni che mi servono per chiamare API esterne
//
// 1. buildUrl
//   preparo l'URL con i parametri giusti
//
// 2. callApi
//   faccio la fetch e trasformo gli errori in quelli del nostro backend


import { AppError } from "../utils/AppError";

export function buildUrl(base: string, percorso: string, parametri: Record<string, unknown> = {}): string {
    // metto insieme base e percorso senza fare casino con gli slash
    const url = new URL(base.replace(/\/+$/, "") + "/" + percorso.replace(/^\/+/, ""));
    for (const [chiave, valore] of Object.entries(parametri)) {
        if (valore !== undefined && valore !== null && valore !== "") {
            url.searchParams.set(chiave, String(valore));
        }
    }
    return url.toString();
}

export async function callApi(url: string, nomeServizio: string, headers: Record<string, string> = {}): Promise<any> {
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

    // qui vedo cosa ha risposto l'API, ma non lo mando al client
    console.warn(`⚠️  ${nomeServizio} ha risposto ${risposta.status} per ${url.replace(/(api_key|key)=[^&]+/g, "$1=***")}`);

    if (risposta.status === 404) throw new AppError("Contenuto non trovato", 404);
    if (risposta.status === 401 || risposta.status === 403) {
        throw new AppError(`${nomeServizio}: chiave API mancante o non valida (controllate il .env)`, 502);
    }
    if (risposta.status === 429) throw new AppError(`${nomeServizio}: troppe richieste, riprova tra poco`, 503);
    throw new AppError(`Errore dal servizio ${nomeServizio} (status ${risposta.status})`, 502);
}
