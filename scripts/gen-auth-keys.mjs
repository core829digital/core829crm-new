// Genera la coppia di chiavi con cui il CRM firma e verifica i token di accesso.
// Uso:  node scripts/gen-auth-keys.mjs
// Stampa due comandi da copiare ed eseguire. La chiave PRIVATA non va mai salvata in un file del repository.
import { generateKeyPairSync, createPublicKey } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const priv = privateKey.export({ format: "jwk" });
const pub = createPublicKey(privateKey).export({ format: "jwk" });
const kid = "crm-1";
const privateJwk = JSON.stringify({ ...priv, alg: "RS256", use: "sig", kid });
const jwks = JSON.stringify({ keys: [{ ...pub, alg: "RS256", use: "sig", kid }] });

console.log("Esegui questi due comandi (uno per volta), poi `npx convex deploy`:\n");
console.log(`npx convex env set CRM_JWT_PRIVATE_JWK '${privateJwk}'\n`);
console.log(`npx convex env set CRM_JWKS '${jwks}'\n`);
