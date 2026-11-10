/**
 * Content-Security-Policy del CRM. Funzione pura (nessun accesso a process.env o a Next): si puo' provare da sola.
 * Il nonce e' nuovo a ogni richiesta e lo applica Next.js ai propri script (vedi src/proxy.ts).
 */

export type CspOptions = {
  nonce: string;
  /** In sviluppo React richiede `unsafe-eval` e gli strumenti di Next iniettano stili senza nonce. */
  isDev: boolean;
  /** Es. https://xxx.convex.cloud: database, WebSocket, file caricati (anteprime, chat). */
  convexUrl?: string;
};

function convexOrigins(convexUrl?: string): { http: string[]; connect: string[] } {
  if (convexUrl) {
    try {
      const u = new URL(convexUrl);
      const ws = u.protocol === "https:" ? "wss:" : "ws:";
      return { http: [u.origin], connect: [u.origin, `${ws}//${u.host}`] };
    } catch {
      // URL non valido: si ricade sul dominio generico.
    }
  }
  return { http: ["https://*.convex.cloud"], connect: ["https://*.convex.cloud", "wss://*.convex.cloud"] };
}

export function buildCsp({ nonce, isDev, convexUrl }: CspOptions): string {
  const convex = convexOrigins(convexUrl);
  const devConnect = isDev ? ["http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*", "ws://127.0.0.1:*"] : [];

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    // Solo script con il nonce di questa richiesta; `strict-dynamic` estende la fiducia agli script caricati da quelli fidati.
    // Nessun `unsafe-inline` in produzione: uno script iniettato da un attaccante non viene eseguito.
    ["script-src", ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])]],
    // Gli elementi <style> richiedono il nonce; gli attributi style="" non eseguono codice e restano consentiti.
    ["style-src", isDev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`]],
    ["style-src-attr", ["'unsafe-inline'"]],
    // Immagini: proprie, data/blob (anteprime) e l'archivio file di Convex (allegati della chat).
    ["img-src", ["'self'", "blob:", "data:", ...convex.http]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'", ...convex.connect, ...devConnect]],
    ["media-src", ["'self'", "blob:", ...convex.http]],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    // L'anteprima dei PDF dei preventivi/fatture e' un iframe verso l'archivio file di Convex (con sandbox).
    ["frame-src", [...convex.http]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];

  const parts = directives.map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/** Nonce da 128 bit, base64 (Web Crypto, disponibile nel runtime del proxy). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
