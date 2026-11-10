import { JWT_AUDIENCE, JWT_ISSUER } from "./lib/authConst";

/**
 * Il CRM emette da solo i token di accesso (RS256) al login; Convex li verifica con la chiave PUBBLICA
 * contenuta nella variabile CRM_JWKS. Senza quella variabile NESSUN accesso e' possibile (si chiude, non si apre).
 * Chiavi: `node scripts/gen-auth-keys.mjs` (vedi docs/SECURITY-SERVER.md).
 */
const rawJwks = process.env.CRM_JWKS;
// JSON oppure base64 del JSON (la base64 non si rovina con le virgolette della shell).
const jwks = rawJwks ? (rawJwks.trim().startsWith("{") ? rawJwks.trim() : atob(rawJwks.trim())) : undefined;

export default {
  providers: jwks
    ? [
        {
          type: "customJwt" as const,
          applicationID: JWT_AUDIENCE,
          issuer: JWT_ISSUER,
          jwks: `data:text/plain;charset=utf-8;base64,${btoa(jwks)}`,
          algorithm: "RS256" as const,
        },
      ]
    : [],
};
