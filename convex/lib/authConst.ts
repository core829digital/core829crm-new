/** Valori condivisi tra la firma del token (login) e la verifica (auth.config.ts). */
export const JWT_ISSUER = "core829-crm";
export const JWT_AUDIENCE = "core829-crm-app";
export const JWT_KEY_ID = "crm-1";
/** Durata del token = durata della sessione nell'interfaccia (3 ore). */
export const SESSION_SECONDS = 3 * 60 * 60;
