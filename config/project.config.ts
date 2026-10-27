
// config/project.config.ts
// regole del progetto

// 1. tipi di contenuto
// qui c'è solo il libro
export const TIPI_CONTENUTO = ["book"] as const;
export type TipoContenuto = (typeof TIPI_CONTENUTO)[number];

// 2. stati di lettura
// questo è lo stato iniziale quando salvo un libro
export const STATI = ["da_leggere", "in_lettura", "letto"] as const;
export type Stato = (typeof STATI)[number];
export const STATO_DEFAULT: Stato = STATI[0];

// 3. valutazioni da 1 a 5
export const VOTO_MIN = 1;
export const VOTO_MAX = 5;

// 4. scaffali base
// li creo subito quando un utente si registra
export const LISTE_PREDEFINITE: string[] = ["Da leggere", "In lettura", "Letti"];

// 5. limiti vari
export const PASSWORD_MIN = 6;          // lunghezza minima della password
export const COMMENTO_MAX = 1000;       // massimo caratteri di un commento
export const LIMITE_DEFAULT = 20;       // elementi per pagina
export const LIMITE_MAX = 50;           // massimo elementi per pagina
