# Sicurezza lato server del CRM

## Cosa è cambiato
- **Ogni funzione del database controlla chi la chiama.** Prima i permessi erano solo nascosti nell'interfaccia: chi conosceva l'indirizzo del database poteva leggere/cancellare tutto. Ora senza accesso valido non risponde nulla.
- **Il login emette un token firmato dal server** (RS256, 3 ore). Il database lo verifica ad ogni richiesta. L'identità arriva dal token, mai dagli argomenti della chiamata (`userId`, `adminUserId`, `_userId`… sono ignorati o devono coincidere col token).
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
3. Riapri il CRM: tutti dovranno rifare l'accesso una volta (le vecchie sessioni non hanno il token).
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
- Il token è conservato nel browser (come la sessione di prima): se un attaccante esegue codice nella pagina (XSS) può usarlo per 3 ore. Non ci sono contenuti HTML non filtrati nel CRM, ma conviene aggiungere una Content-Security-Policy.
- Un token resta valido fino alla scadenza anche dopo un cambio password (ma non dopo l'eliminazione dell'utente).
- Tutti gli utenti connessi vedono tutti i lead e clienti (il CRM è condiviso per design); le chat sono invece private per membro.
