# BookTrack

Backend Node.js (TypeScript + Bun, Express, MongoDB) per la verifica intermedia di Programmazione Node.js.

Gli utenti possono registrarsi, cercare libri su **Open Library**, salvarli, metterli sugli **scaffali**, segnare lo stato di lettura
(*da leggere / in lettura / letto*), aggiornare la **pagina corrente** (con percentuale di avanzamento), dare un **voto da 1 a 5** e scrivere una **recensione**.

## Avvio

```bash
npm install
cp .env.example .env        # se non c'è già il file .env
npm run seed                # (facoltativo) crea l'utente prova@test.it / password123
npm run dev                 # avvia il server
```

Prova: <http://localhost:3000/api/health>

Servono Node.js e **MongoDB acceso** (`mongodb://127.0.0.1:27017/booktrack`, modificabile in `.env`).
Open Library è gratuita: **non serve nessuna chiave API**.

| Script | A cosa serve |
|---|---|
| `npm run dev` | sviluppo, si riavvia a ogni salvataggio |
| `npm start` | avvio normale |
| `npm run check` | controlla gli errori di TypeScript |
| `npm run seed` | crea l'utente di prova |

## Come è fatto il progetto

| Cartella / file | Contenuto |
|---|---|
| `index.ts`, `app.ts` | avvio del server e configurazione di Express |
| `config/progetto.config.ts` | stati di lettura, voti 1-5, scaffali creati alla registrazione |
| `config/` | `.env`, database, Passport (JWT) |
| `models/` | `User`, `Contenuto` (il libro salvato), `Lista` (lo scaffale), `Valutazione`, `Commento` (la recensione) |
| `services/openLibrary.service.ts` | chiamate a Open Library (ricerca e dettaglio) |
| `controllers/` | la logica di ogni rotta |
| `routes/` | gli URL |
| `middleware/` | autenticazione, validazione degli id, gestione errori |
| `utils/` | funzioni di aiuto (errori, risposte, validazione) |
| `postman/` | collection con tutte le rotte |

## Rotte

Base URL: `http://localhost:3000/api`. 🔒 = serve l'header `Authorization: Bearer <token>`.

### A. Utenti
| Metodo | URL | 🔒 | Body |
|---|---|---|---|
| POST | `/auth/register` | | `nome, email, password` |
| POST | `/auth/login` | | `email, password` → restituisce il `token` |
| POST | `/auth/logout` | 🔒 | (dopo il logout il token non vale più) |
| GET | `/auth/me` | 🔒 | |

### B. Open Library
| Metodo | URL | 🔒 | Note |
|---|---|---|---|
| GET | `/ricerca?q=dune` | 🔒 | cerca per titolo, autore o ISBN insieme |
| GET | `/ricerca?q=tolkien&campo=autore` | 🔒 | `campo` = `titolo`, `autore` o `isbn` (+ `&pagina=2`) |
| GET | `/ricerca/book/:idEsterno` | 🔒 | dettaglio: titolo, autori, anno, pagine, generi, copertina |

`idEsterno` è l'id Open Library, ad esempio `OL45804W` (lo trovi nei risultati della ricerca).

### C. I miei libri
| Metodo | URL | 🔒 | Body / Query |
|---|---|---|---|
| POST | `/libri` | 🔒 | `idEsterno, stato?, listaId?` → salva il libro |
| GET | `/libri` | 🔒 | `?stato=in_lettura&q=titolo&ordina=recenti\|vecchi\|titolo\|anno&pagina=&limite=` |
| GET | `/libri/statistiche` | 🔒 | libri per stato e media dei voti |
| GET | `/libri/:id` | 🔒 | `?completo=true` aggiunge i dati di Open Library |
| PATCH | `/libri/:id` | 🔒 | `note?, pagine?` |
| PATCH | `/libri/:id/stato` | 🔒 | `stato` = `da_leggere`, `in_lettura` o `letto` |
| PATCH | `/libri/:id/progresso` | 🔒 | `paginaCorrente` → risponde con la `percentuale` (solo libri "in_lettura") |
| DELETE | `/libri/:id` | 🔒 | elimina anche recensioni e voto |

### D. Scaffali
| Metodo | URL | 🔒 | Body |
|---|---|---|---|
| POST | `/scaffali` | 🔒 | `nome, descrizione?` |
| GET | `/scaffali` | 🔒 | |
| GET | `/scaffali/:id` | 🔒 | con i libri dentro |
| PATCH | `/scaffali/:id` | 🔒 | `nome?, descrizione?` |
| DELETE | `/scaffali/:id` | 🔒 | i libri restano salvati |
| POST | `/scaffali/:id/libri` | 🔒 | `contenutoId` (aggiunge un libro) |
| DELETE | `/scaffali/:id/libri/:contenutoId` | 🔒 | toglie il libro dallo scaffale |
| POST | `/scaffali/:id/libri/:contenutoId/sposta` | 🔒 | `aScaffaleId` (sposta il libro in un altro scaffale) |

Alla registrazione si creano tre scaffali: **Da leggere**, **In lettura**, **Letti**.

### E. Voti e recensioni
| Metodo | URL | 🔒 | Body |
|---|---|---|---|
| PUT | `/libri/:id/valutazione` | 🔒 | `voto` (intero da 1 a 5) |
| GET / DELETE | `/libri/:id/valutazione` | 🔒 | |
| GET | `/libri/:id/commenti` | 🔒 | le recensioni del libro |
| POST | `/libri/:id/commenti` | 🔒 | `testo` |
| PATCH / DELETE | `/commenti/:id` | 🔒 | `testo` |

> ⚠️ `:id` e `contenutoId` sono l'`_id` di MongoDB del libro **salvato**, non l'id di Open Library.
> L'id di Open Library serve solo per `/ricerca/book/...` e per `POST /libri`.

## Flusso d'uso (come in Postman)

1. `POST /auth/register` → `POST /auth/login` (copia il `token`)
2. `GET /ricerca?q=dune` → scegli un `idEsterno`
3. `POST /libri` con `{ "idEsterno": "OL893415W" }`
4. `PATCH /libri/:id/stato` con `{ "stato": "in_lettura" }`
5. `PATCH /libri/:id/progresso` con `{ "paginaCorrente": 120 }` → `percentuale`
6. `PUT /libri/:id/valutazione` con `{ "voto": 4 }` e `POST /libri/:id/commenti` con `{ "testo": "..." }`
7. `POST /auth/logout`

## Risposte e codici HTTP

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "message": "Libro non trovato", "status": 404 } }
```

| Codice | Quando |
|---|---|
| 200 / 201 | ok / creato |
| 400 | dati mancanti o sbagliati (stato, voto fuori da 1-5, pagina oltre il numero di pagine...) |
| 401 | token mancante, scaduto o dopo il logout; credenziali sbagliate |
| 404 | rotta o risorsa inesistente **o di un altro utente** |
| 409 | duplicato (email, libro già salvato, scaffale con lo stesso nome) |
| 502 / 503 / 504 | Open Library dà errore / troppe richieste / non risponde |

## Sicurezza

- password salvate solo come hash **bcrypt**
- **logout vero**: il token viene azzerato sul server
- ogni query filtra per utente: nessuno vede o modifica i libri, gli scaffali e le recensioni di un altro
- limite ai tentativi di login (10 ogni 15 minuti)
