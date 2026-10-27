# Postman

`BookTrack.postman_collection.json` contiene **tutte le rotte in ordine di flusso**, con un caso d'errore per ogni gruppo.

1. Postman → **Import** → scegli il file `.json`.
2. Avvia il server (`npm run dev`).
3. Controlla le variabili della collection: `baseUrl` = `http://localhost:3000/api`, `query` = cosa cercare (es. `dune`).
4. Esegui le richieste dall'alto in basso, oppure **Run collection**.

Da sole:
- **Login** salva il `token` (usato da tutte le richieste come Bearer Token).
- **Cerca** salva il primo `idEsterno`, **Salva libro** salva `contenutoId`, **Crea scaffale** salva `listaId`, **Aggiungi recensione** salva `commentoId`.
- Ogni richiesta controlla lo status atteso.

