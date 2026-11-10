// Genera la coppia di chiavi con cui il CRM firma e verifica i token di accesso.
// Uso:  node scripts/gen-auth-keys.mjs [nome-deployment]   (es. first-fennec-336)
// Stampa due comandi da copiare ed eseguire. La chiave PRIVATA non va mai salvata in un file del repository.
import { generateKeyPairSync, createPublicKey } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const priv = privateKey.export({ format: "jwk" });
const pub = createPublicKey(privateKey).export({ format: "jwk" });
const kid = "crm-1";
const dep = process.argv[2] ? ` --deployment ${process.argv[2]}` : "";
const privateJwk = JSON.stringify({ ...priv, alg: "RS256", use: "sig", kid });
const jwks = JSON.stringify({ keys: [{ ...pub, alg: "RS256", use: "sig", kid }] });

console.log("Esegui questi due comandi (uno per volta), poi `npx convex deploy`. Le variabili valgono per UN deployment: ripeti per ogni deployment (sviluppo e produzione).\n");
console.log(`npx convex env set${dep} CRM_JWT_PRIVATE_JWK '${privateJwk}'\n`);
console.log(`npx convex env set${dep} CRM_JWKS '${jwks}'\n`);
