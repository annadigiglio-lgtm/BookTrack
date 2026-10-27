# BookTrack

BookTrack è un backend REST per tenere traccia dei libri che si stanno leggendo. Il progetto è realizzato con TypeScript, Bun, Express e MongoDB e usa Open Library per cercare i libri e recuperarne i dettagli.

## Funzionalità

- Registrazione, login e gestione del profilo utente.
- Ricerca di libri per titolo, autore o ISBN tramite Open Library.
- Salvataggio dei libri nella propria raccolta.
- Creazione e gestione di scaffali personali.
- Aggiornamento dello stato di lettura e della pagina raggiunta.
- Valutazioni da 1 a 5 e recensioni testuali.
- Statistiche sulla raccolta personale.

## Requisiti

- [Bun](https://bun.sh/) installato.
- MongoDB in esecuzione, in locale o su un servizio remoto.
- Connessione a Internet per le richieste a Open Library.

## Installazione e avvio

Dalla cartella del progetto:

```bash
bun install
```

Configura le variabili d'ambiente nel file `.env` usando `.env.example` come riferimento. Assicurati che `MONGO_URI` punti al database corretto e che `PORT` corrisponda alla porta desiderata.

Per avviare il server in sviluppo:

```bash
bun run dev
```

Per l'avvio normale:

```bash
bun start
```

Quando il server è attivo, verifica il funzionamento aprendo `http://localhost:3000/api/health` (se hai configurato una porta diversa, usa quella).

Il progetto usa Open Library e non richiede una chiave API.

## Comandi disponibili

| Comando | Descrizione |
|---|---|
| `bun run dev` | Avvia il server in modalità sviluppo, con riavvio automatico. |
| `bun start` | Avvia il server. |
| `bun run check` | Esegue il controllo TypeScript senza generare file. |
| `bun run seed` | Crea i dati iniziali previsti dallo script `scripts/seed.ts`. |

## Struttura del progetto

| Percorso | Descrizione |
|---|---|
| `index.ts` | Connessione al database e avvio del server. |
| `app.ts` | Configurazione di Express, middleware e rotte. |
| `config/` | Configurazione di ambiente, database, Passport e impostazioni del progetto. |
| `models/` | Modelli Mongoose per utenti, libri salvati, scaffali, valutazioni e recensioni. |
| `controllers/` | Gestione delle richieste e preparazione delle risposte. |
| `routes/` | Definizione degli endpoint dell'API. |
| `services/` | Comunicazione con Open Library e gestione dei dati del catalogo. |
| `middleware/` | Autenticazione, validazione degli ID e gestione degli errori. |
| `utils/` | Funzioni condivise per validazione, risposte ed errori. |
| `types/` | Tipi condivisi usati dal catalogo. |
| `scripts/seed.ts` | Script per inserire i dati iniziali. |
| `postman/` | Collection Postman per provare gli endpoint. |

## API

URL base: `http://localhost:3000/api`.

Le rotte contrassegnate con **Sì** richiedono un token JWT nell'header:

```http
Authorization: Bearer <token>
```

### Autenticazione e profilo

| Metodo | Endpoint | Autenticazione | Descrizione |
|---|---|---|---|
| `POST` | `/auth/register` | No | Registra un utente (`nome`, `email`, `password`). |
| `POST` | `/auth/login` | No | Effettua il login (`email`, `password`) e restituisce un token. |
| `POST` | `/auth/logout` | Sì | Invalida il token corrente. |
| `GET` | `/auth/me` | Sì | Restituisce il profilo dell'utente autenticato. |
| `PATCH` | `/auth/me` | Sì | Aggiorna il profilo e, se richiesto, la password. |
| `DELETE` | `/auth/me` | Sì | Elimina l'account e i dati associati. |

### Ricerca su Open Library

| Metodo | Endpoint | Autenticazione | Descrizione |
|---|---|---|---|
| `GET` | `/ricerca?q=dune` | Sì | Cerca per titolo, autore o ISBN. |
| `GET` | `/ricerca?q=tolkien&campo=autore&pagina=2` | Sì | Cerca per autore e seleziona la pagina dei risultati. |
| `GET` | `/ricerca/:tipo/:idEsterno` | Sì | Recupera il dettaglio di un libro. |

Il parametro `campo` accetta `titolo`, `autore` o `isbn`. Per il dettaglio, `tipo` è il tipo di contenuto previsto dal progetto e `idEsterno` è l'identificativo Open Library, ad esempio `OL45804W`.

### Libri salvati

| Metodo | Endpoint | Autenticazione | Descrizione |
|---|---|---|---|
| `POST` | `/libri` | Sì | Salva un libro (`idEsterno`, con eventuali `stato` e `listaId`). |
| `GET` | `/libri` | Sì | Elenca i libri salvati; supporta filtri e ordinamento. |
| `GET` | `/libri/statistiche` | Sì | Restituisce statistiche della raccolta. |
| `GET` | `/libri/:id` | Sì | Recupera un libro salvato; `?completo=true` richiede anche i dettagli esterni. |
| `PATCH` | `/libri/:id` | Sì | Aggiorna i campi modificabili, come note e numero di pagine. |
| `PATCH` | `/libri/:id/stato` | Sì | Modifica lo stato di lettura. |
| `PATCH` | `/libri/:id/progresso` | Sì | Aggiorna la pagina corrente e restituisce la percentuale di avanzamento. |
| `DELETE` | `/libri/:id` | Sì | Elimina il libro dalla raccolta e le valutazioni e recensioni collegate. |

Per l'elenco si possono usare i parametri `stato`, `q`, `ordina`, `pagina` e `limite`. Gli stati previsti sono `da_leggere`, `in_lettura` e `letto`.

### Scaffali

| Metodo | Endpoint | Autenticazione | Descrizione |
|---|---|---|---|
| `POST` | `/scaffali` | Sì | Crea uno scaffale (`nome`, eventuale `descrizione`). |
| `GET` | `/scaffali` | Sì | Elenca gli scaffali dell'utente. |
| `GET` | `/scaffali/:id` | Sì | Mostra uno scaffale con i libri associati. |
| `PATCH` | `/scaffali/:id` | Sì | Modifica nome o descrizione. |
| `DELETE` | `/scaffali/:id` | Sì | Elimina lo scaffale, senza cancellare i libri salvati. |
| `POST` | `/scaffali/:id/libri` | Sì | Aggiunge un libro salvato (`contenutoId`). |
| `DELETE` | `/scaffali/:id/libri/:contenutoId` | Sì | Rimuove un libro dallo scaffale. |
| `POST` | `/scaffali/:id/libri/:contenutoId/sposta` | Sì | Sposta un libro in un altro scaffale (`aScaffaleId`). |

Alla registrazione vengono creati gli scaffali iniziali previsti dalla configurazione del progetto.

### Valutazioni e recensioni

| Metodo | Endpoint | Autenticazione | Descrizione |
|---|---|---|---|
| `GET` | `/libri/:contenutoId/valutazione` | Sì | Legge la valutazione dell'utente per il libro. |
| `PUT` | `/libri/:contenutoId/valutazione` | Sì | Crea o aggiorna una valutazione da 1 a 5 (`voto`). |
| `DELETE` | `/libri/:contenutoId/valutazione` | Sì | Elimina la valutazione. |
| `GET` | `/libri/:contenutoId/commenti` | Sì | Elenca le recensioni del libro. |
| `POST` | `/libri/:contenutoId/commenti` | Sì | Aggiunge una recensione (`testo`). |
| `PATCH` | `/commenti/:id` | Sì | Modifica una recensione propria. |
| `DELETE` | `/commenti/:id` | Sì | Elimina una recensione propria. |

**Attenzione agli identificativi:** `:id` e `contenutoId` indicano l'ID MongoDB del libro già salvato. `idEsterno` è invece l'ID del libro su Open Library e viene usato per la ricerca e il salvataggio iniziale.

## Esempio di utilizzo

1. Registra un account con `POST /auth/register`.
2. Accedi con `POST /auth/login` e copia il token restituito.
3. Cerca un libro con `GET /ricerca?q=dune`.
4. Salvalo con `POST /libri`, passando l'`idEsterno` trovato.
5. Aggiorna lo stato con `PATCH /libri/:id/stato`, ad esempio con `{ "stato": "in_lettura" }`.
6. Aggiorna la pagina letta con `PATCH /libri/:id/progresso`, usando `{ "paginaCorrente": 120 }`.
7. Aggiungi una valutazione con `PUT /libri/:id/valutazione` e una recensione con `POST /libri/:id/commenti`.

Per le richieste protette, aggiungi sempre l'header `Authorization: Bearer <token>`.

## Formato delle risposte

Le risposte seguono, in generale, una struttura comune. In caso di successo:

```json
{
  "success": true,
  "data": {}
}
```

In caso di errore:

```json
{
  "success": false,
  "error": {
    "message": "Libro non trovato",
    "status": 404
  }
}
```

I codici restituiti dipendono dalla richiesta: tra quelli usati ci sono `200` e `201` per operazioni riuscite, `400` per dati non validi, `401` per autenticazione non valida, `404` per risorse non trovate, `409` per conflitti e codici `5xx` per errori del server o del servizio esterno.

## Sicurezza

- Le password vengono salvate come hash bcrypt.
- Il logout invalida il token memorizzato sul server.
- Le operazioni sui dati personali sono limitate all'utente autenticato.
- I tentativi di login sono limitati a 10 ogni 15 minuti.
