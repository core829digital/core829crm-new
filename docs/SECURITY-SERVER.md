# Sicurezza lato server del CRM

## Cosa è cambiato
- **Ogni funzione del database controlla chi la chiama.** Prima i permessi erano solo nascosti nell'interfaccia: chi conosceva l'indirizzo del database poteva leggere/cancellare tutto. Ora senza accesso valido non risponde nulla.
- **Cookie di sessione HttpOnly + token breve.** Al login il server imposta un cookie `HttpOnly; Secure; SameSite=Strict` (il JavaScript della pagina non può leggerlo). Con quel cookie il server rilascia un token firmato (RS256) che dura **10 minuti** e vive solo in memoria, mai in localStorage. Il database lo verifica ad ogni richiesta. La sessione dura al massimo 8 ore. L'identità arriva dal token, mai dagli argomenti della chiamata (`userId`, `adminUserId`, `_userId`… sono ignorati o devono coincidere col token).
- **Solo l'amministratore (ID 00001)**: creare/modificare utenti, doppioni (Data), importazione dal portale, eliminare un cliente (con tutto il suo contenuto), annunci, obiettivo di ricavo, registro attività, migrazioni.
- **Password**: PBKDF2-SHA256 (100.000 iterazioni). Le password vecchie (SHA-256 semplice) funzionano ancora e vengono aggiornate da sole al primo accesso. Minimo 10 caratteri per le nuove.
- **Blocco tentativi**: dopo 5 errori in 15 minuti il login si blocca. (Prima non scattava mai: un errore annullava anche il conteggio.)
- `seed.seedAdmin` non è più pubblico e **non contiene più nessuna password**.
- Un utente eliminato perde l'accesso subito, anche con un token ancora valido.
- Un test automatico (`convex/security.test.ts`) fallisce se in futuro qualcuno aggiunge una funzione pubblica senza controllo.

## ⚠️ Password dell'amministratore: cambiala subito
La vecchia password iniziale era scritta nel codice di un repository pubblico (resta nella cronologia di Git). **Va considerata compromessa**: cambiala da *My account* (cliccando il tuo nome in alto a destra) appena fatto l'accesso.

## Passi manuali (in quest'ordine)
1. Genera le chiavi: `node scripts/gen-auth-keys.mjs` e lancia i **due comandi** che stampa (variabili `CRM_JWT_PRIVATE_JWK` e `CRM_JWKS` nel database Convex del CRM). Non salvare la chiave privata in nessun file del repository.
2. `npx convex deploy`.
3. Riapri il CRM: tutti dovranno rifare l'accesso una volta (le vecchie sessioni stavano in localStorage e vengono ignorate).
4. Cambia la password dell'amministratore (My account).
5. Verifica: dopo il login il Kanban si carica; da una finestra non connessa, aprire una pagina del CRM porta al login.

Se le variabili mancano, **nessuno può entrare** (il sistema si chiude, non si apre).

## Nuovo ambiente da zero
```bash
npx convex env set CRM_ADMIN_INITIAL_PASSWORD "<password lunga, min 12 caratteri>"
npx convex run seed:seedAdmin
```
Poi cambia la password da *My account* e rimuovi la variabile (`npx convex env remove CRM_ADMIN_INITIAL_PASSWORD`).

## Limiti noti (onesti)
- Se un attaccante riuscisse a eseguire codice nella pagina (XSS), non potrebbe rubare la sessione (il cookie è HttpOnly) né portarla via con sé: potrebbe però agire dalla pagina aperta finché l'utente è connesso (chiamare il CRM al suo posto). La Content-Security-Policy rende questo scenario molto più difficile, ma nessuna difesa lo elimina in assoluto.
- Un token breve resta valido fino alla sua scadenza (max 10 minuti) anche dopo logout/cambio password; la sessione invece viene chiusa subito (nessun nuovo token).
- Tutti gli utenti connessi vedono tutti i lead e clienti (il CRM è condiviso per design); le chat sono invece private per membro.

## Content-Security-Policy (CSP)
Il browser esegue solo gli script che il server ha autorizzato per quella singola visita (un codice casuale, «nonce», diverso a ogni richiesta). Uno script iniettato da un attaccante, anche dentro la pagina, **non viene eseguito**.
- Codice: `src/lib/csp.ts` (policy) e `src/proxy.ts` (nonce + header). Altri header in `next.config.ts`: HSTS, Permissions-Policy (niente fotocamera/microfono/posizione), COOP, X-Frame-Options.
- Consentito, e solo questo: pagine e file propri; database, WebSocket, immagini e anteprime PDF **solo del tuo deployment Convex** (`NEXT_PUBLIC_CONVEX_URL`). Niente `unsafe-inline`/`unsafe-eval` per gli script in produzione, nessun `<object>`, nessun altro sito può incorniciare il CRM.
- Collaudato in un browser vero: 12 pagine (anonime e con sessione) senza nessuna violazione, e uno script inline senza nonce, simulando un attacco, viene bloccato.
- **Se aggiungi un servizio esterno** (analytics, font esterni, mappe, widget) la CSP lo bloccherà: va aggiunto in `src/lib/csp.ts` (e al test `scripts/csp.test.mjs`). In Chrome, la console mostra «Refused to…» con il nome esatto della direttiva da aprire.
- Il CRM resta dinamico (`force-dynamic`), requisito del nonce: niente pagine statiche in cache.

## Come funziona la sessione (cookie HttpOnly)
1. `POST /api/auth/login` (route Next.js): verifica le credenziali su Convex; se giuste, crea una sessione (nel database resta solo l'**hash** del segreto) e imposta il cookie `__Host-crm_session`. Al browser non arriva alcun token leggibile.
2. `GET /api/auth/token`: se il cookie è valido, il server ottiene da Convex un token da **10 minuti** (con l'id della sessione) e lo restituisce alla pagina, che lo tiene in memoria e lo rinnova da sola.
3. `POST /api/auth/logout`: **elimina la sessione dal database** (non basta cancellare il cookie) e svuota il cookie.
4. Cambio password: le sessioni degli altri dispositivi vengono chiuse. Password reimpostata dall'amministratore: l'utente viene scollegato ovunque.
5. Le sessioni scadute vengono eliminate ogni notte.
- Difese: SameSite=Strict + controllo `Origin`/`Sec-Fetch-Site` (CSRF), segreto da 256 bit, risposta `no-store`, senza cookie le pagine rimandano subito a `/login`.
- Collaudato in un browser vero (con un finto database): `document.cookie` è vuoto, localStorage/sessionStorage senza token, logout con revoca, 401 dopo il logout, nessuna violazione CSP.
