/** Valori condivisi tra la firma del token (login) e la verifica (auth.config.ts). */
export const JWT_ISSUER = "core829-crm";
export const JWT_AUDIENCE = "core829-crm-app";
export const JWT_KEY_ID = "crm-1";
/** Il token che il browser presenta a Convex dura poco: se rubato, scade in minuti. */
export const TOKEN_SECONDS = 10 * 60;
/** La sessione (cookie HttpOnly) dura al massimo 8 ore, poi si rifa' il login. */
export const SESSION_SECONDS = 8 * 60 * 60;
