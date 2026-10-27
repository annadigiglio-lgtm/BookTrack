
// services/openLibrary.service.ts  –  Integrazione Open Library (libri)

// Documentazione: https://openlibrary.org/developers/api
// Non serve nessuna chiave API.
//
// Endpoint usati:
//   Ricerca:   GET {base}/search.json?q=dune&page=1&limit=20
//              (oppure ?title=...  ?author=...  ?isbn=...)
//   Dettaglio: GET {base}/works/OL45804W.json   (descrizione e soggetti)
//              + una ricerca con q=key:/works/OL45804W per avere
//                autori, anno, numero di pagine e copertina
//
// Copertina: https://covers.openlibrary.org/b/id/{cover_i}-M.jpg


import { env } from "../config/env.config";
import type { TipoContenuto } from "../config/project.config";
import type { ContenutoEsterno, DettaglioEsterno, RisultatoRicerca, ServizioCatalogo } from "../types/catalog";
import { AppError } from "../utils/AppError";
import { callApi, buildUrl } from "./http";

const FONTE = "openlibrary";
const NOME = "Open Library";
const RISULTATI_PER_PAGINA = 20;

// Campi che chiediamo alla ricerca (così la risposta è più leggera)
const CAMPI = "key,title,author_name,first_publish_year,number_of_pages_median,subject,cover_i,isbn,ratings_average";

// ?campo=titolo|autore|isbn  ->  nome del parametro di Open Library
const PARAMETRO_CAMPO: Record<string, string> = {
    titolo: "title",
    autore: "author",
    isbn: "isbn",
};

// Open Library chiede di dichiararsi con uno User-Agent
const HEADERS = { "User-Agent": "BookTrack (progetto scolastico ITS)" };

function getOpenLibrary(percorso: string, parametri: Record<string, unknown> = {}) {
    const url = buildUrl(env.openLibrary.baseUrl, percorso, parametri);
    return callApi(url, NOME, HEADERS);
}

// "/works/OL45804W" -> "OL45804W"
function cleanId(key: string): string {
    return key.replace("/works/", "");
}

function coverUrl(coverId: number | undefined): string | null {
    return coverId ? `${env.openLibrary.coversUrl}/b/id/${coverId}-M.jpg` : null;
}

// La descrizione di un "work" può essere una stringa oppure { type, value }
function readDescription(descrizione: any): string {
    if (!descrizione) return "";
    return typeof descrizione === "string" ? descrizione : String(descrizione.value ?? "");
}

// Traduce un risultato di Open Library nel nostro formato (types/catalog.ts)
function normalize(doc: any, tipo: TipoContenuto): ContenutoEsterno {
    return {
        idEsterno: cleanId(String(doc.key)),
        fonte: FONTE,
        tipo,
        titolo: doc.title ?? "(senza titolo)",
        descrizione: "", // la ricerca non la restituisce: c'è solo nel dettaglio
        immagine: coverUrl(doc.cover_i),
        anno: doc.first_publish_year ?? null,
        votoMedio: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : null,
        extra: {
            autori: doc.author_name ?? [],
            pagine: doc.number_of_pages_median ?? null,
            generi: (doc.subject ?? []).slice(0, 10), // i "subjects" sono tantissimi: ne teniamo 10
            isbn: doc.isbn?.[0] ?? null,
        },
    };
}

async function search(query: string, tipo: TipoContenuto, pagina = 1, opzioni: Record<string, string> = {}): Promise<RisultatoRicerca> {
    // Se l'utente sceglie il campo (titolo/autore/isbn) usiamo quel parametro,
    // altrimenti una ricerca generica con "q"
    const parametroCampo = PARAMETRO_CAMPO[opzioni.campo ?? ""];
    const data = await getOpenLibrary("/search.json", {
        [parametroCampo ?? "q"]: query,
        page: pagina,
        limit: RISULTATI_PER_PAGINA,
        fields: CAMPI,
    });

    const totale: number = data.numFound ?? 0;
    return {
        pagina,
        totalePagine: Math.ceil(totale / RISULTATI_PER_PAGINA),
        totaleRisultati: totale,
        risultati: (data.docs ?? []).map((doc: any) => normalize(doc, tipo)),
    };
}

async function getDetails(idEsterno: string, tipo: TipoContenuto): Promise<DettaglioEsterno> {
    // Gli id di Open Library sono del tipo OL45804W: controlliamo il formato
    // (così evitiamo di chiamare l'API con id inventati)
    if (!/^OL\d+W$/.test(idEsterno)) {
        throw new AppError('idEsterno non valido: deve essere un id Open Library tipo "OL45804W"', 400);
    }

    // Le due chiamate partono insieme
    const [work, ricerca] = await Promise.all([
        getOpenLibrary(`/works/${idEsterno}.json`),
        getOpenLibrary("/search.json", { q: `key:/works/${idEsterno}`, fields: CAMPI, limit: 1 }),
    ]);

    const doc = ricerca.docs?.[0] ?? { key: idEsterno, title: work.title };
    const libro = normalize({ ...doc, title: work.title ?? doc.title }, tipo);
    libro.descrizione = readDescription(work.description);

    return {
        ...libro,
        dettagli: {
            titolo: libro.titolo,
            autori: libro.extra.autori,
            annoPubblicazione: libro.anno,
            pagine: libro.extra.pagine,
            generi: (work.subjects ?? doc.subject ?? []).slice(0, 20),
            copertina: libro.immagine,
            isbn: libro.extra.isbn,
            votoMedio: libro.votoMedio,
            paginaOpenLibrary: `${env.openLibrary.baseUrl}/works/${idEsterno}`,
        },
    };
}

export const openLibraryService: ServizioCatalogo = { fonte: FONTE, search, getDetails };
