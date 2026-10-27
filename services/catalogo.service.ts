
// services/catalogo.service.ts  –  l'unico service usato dai controller

// "Smistatore": in base al TIPO sceglie il service dell'API giusta.
// In BookTrack c'è un solo tipo ("book") collegato a Open Library.
//
// I controller importano SOLO da qui, così se cambia l'API
// i controller non si toccano.


import type { TipoContenuto } from "../config/progetto.config";
import type { ServizioCatalogo } from "../types/catalogo";
import { AppError } from "../utils/AppError";
import { openLibraryService } from "./openLibrary.service";

const SERVIZI: Record<TipoContenuto, ServizioCatalogo> = {
    book: openLibraryService,
};

function servizioPer(tipo: TipoContenuto): ServizioCatalogo {
    const servizio = SERVIZI[tipo];
    if (!servizio) {
        throw new AppError(`Nessuna API configurata per il tipo "${tipo}"`, 500);
    }
    return servizio;
}

export function cerca(query: string, tipo: TipoContenuto, pagina = 1, opzioni: Record<string, string> = {}) {
    return servizioPer(tipo).cerca(query, tipo, pagina, opzioni);
}

export function dettaglio(idEsterno: string, tipo: TipoContenuto) {
    return servizioPer(tipo).dettaglio(idEsterno, tipo);
}
