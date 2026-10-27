// ============================================================
// config/progetto.config.ts  –  le "regole" del progetto BookTrack
// ============================================================
// Modelli, controller e validazioni leggono da qui:
// cambiando questo file si cambiano le regole in tutto il progetto.

// 1. TIPI DI CONTENUTO
// In BookTrack esiste solo il "libro".
export const TIPI_CONTENUTO = ["book"] as const;
export type TipoContenuto = (typeof TIPI_CONTENUTO)[number];

// 2. STATI DI LETTURA
// Il primo stato è quello di DEFAULT quando si salva un libro.
export const STATI = ["da_leggere", "in_lettura", "letto"] as const;
export type Stato = (typeof STATI)[number];
export const STATO_DEFAULT: Stato = STATI[0];

// 3. VALUTAZIONI: da 1 a 5
export const VOTO_MIN = 1;
export const VOTO_MAX = 5;

// 4. SCAFFALI PREDEFINITI
// Creati in automatico quando un utente si registra
// (poi l'utente può crearne quanti ne vuole).
export const LISTE_PREDEFINITE: string[] = ["Da leggere", "In lettura", "Letti"];

// 5. LIMITI VARI
export const PASSWORD_MIN = 6;          // lunghezza minima password
export const COMMENTO_MAX = 1000;       // caratteri massimi di una recensione
export const LIMITE_DEFAULT = 20;       // elementi per pagina
export const LIMITE_MAX = 50;           // massimo elementi per pagina
