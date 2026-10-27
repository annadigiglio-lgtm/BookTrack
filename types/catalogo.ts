
// types/catalogo.ts

// Il "CONTRATTO" tra i service delle API esterne e il resto del progetto.

// Ogni API restituisce i dati in modo diverso. Open Library, per esempio:
//  { key: "/works/OL45804W", title: "Dune", cover_i: 123, author_name: [...] }

// Il service li TRADUCE ("normalizza") in questo formato comune.
// Così controller e modelli non sanno nulla dell'API usata, e cambiare
// API = scrivere un nuovo service che rispetta queste interfacce.


import type { TipoContenuto } from "../config/progetto.config";

// Un risultato di ricerca (dati "di vetrina", quelli che salviamo nel DB)
export interface ContenutoEsterno {
    idEsterno: string;              // id sull'API esterna (sempre stringa)
    fonte: string;                  // "openlibrary"
    tipo: TipoContenuto;            // "book"
    titolo: string;
    descrizione: string;
    immagine: string | null;        // URL COMPLETO dell'immagine
    anno: number | null;
    votoMedio: number | null;       // voto medio dell'API (NON quello personale)
    extra: Record<string, unknown>; // campi specifici (autori, generi, ...)
}

// Il dettaglio: tutto quello sopra + informazioni complete (generi, ISBN, ...)
// che si mostrano ma NON si salvano nel DB.
export interface DettaglioEsterno extends ContenutoEsterno {
    dettagli: Record<string, unknown>;
}

// La risposta di una ricerca, con i dati per la paginazione
export interface RisultatoRicerca {
    pagina: number;
    totalePagine: number;
    totaleRisultati: number;
    risultati: ContenutoEsterno[];
}

// Cosa DEVE avere ogni service di un'API esterna
export interface ServizioCatalogo {
    fonte: string;
    cerca(query: string, tipo: TipoContenuto, pagina: number, opzioni?: Record<string, string>): Promise<RisultatoRicerca>;
    dettaglio(idEsterno: string, tipo: TipoContenuto): Promise<DettaglioEsterno>;
}
