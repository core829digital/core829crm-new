/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeAll, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const sources = import.meta.glob("./*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const idOf = (t: ReturnType<typeof convexTest>, userId: string, role = "setter") =>
  t.run((ctx) => ctx.db.insert("users", { userId, name: "N" + userId, surname: "S", passwordHash: "x", salt: "y", role, createdAt: "x" }));
const as = (t: ReturnType<typeof convexTest>, id: string) => t.withIdentity({ subject: id, issuer: "https://test.local", tokenIdentifier: `https://test.local|${id}` });
const fails = async (p: Promise<unknown>, re: RegExp) => {
  await expect(p).rejects.toThrow(re);
};

describe("copertura: ogni funzione pubblica controlla chi chiama", () => {
  it("nessuna query/mutation/action senza controllo (tranne il login)", () => {
    const open: string[] = [];
    for (const [file, src] of Object.entries(sources)) {
      if (file.includes(".test.") || file.includes("_generated")) continue;
      const parts = src.split(/^(?=export const )/m);
      for (const part of parts) {
        const m = part.match(/^export const (\w+) = (query|mutation|action)\(/);
        if (!m) continue; // internalMutation/internalQuery non sono raggiungibili dal browser
        if (!/requireUser\(|requireAdmin\(|getUserIdentity\(/.test(part)) open.push(`${file}:${m[1]}`);
      }
    }
    expect(open).toEqual(["./users.ts:login"]);
  });
});

describe("accesso", () => {
  it("senza accesso nessuna funzione risponde", async () => {
    const t = convexTest(schema, modules);
    await fails(t.query(api.leads.list, {}), /Not authenticated/);
    await fails(t.query(api.clients.list, {}), /Not authenticated/);
    await fails(t.mutation(api.leads.remove, { id: "x" as never }), /./);
    await fails(t.query(api.users.listUsers, {}), /Not authenticated/);
  });

  it("un utente cancellato dal database perde subito l'accesso (anche con token valido)", async () => {
    const t = convexTest(schema, modules);
    const id = await idOf(t, "10001");
    await as(t, id).query(api.clients.list, {});
    await t.run((ctx) => ctx.db.delete(id as never));
    await fails(as(t, id).query(api.clients.list, {}), /Not authenticated/);
  });

  it("un utente normale non puo' fare le operazioni da amministratore", async () => {
    const t = convexTest(schema, modules);
    await idOf(t, "00001", "ceo");
    const me = as(t, await idOf(t, "10002"));
    await fails(me.mutation(api.users.createUser, { name: "a", surname: "b", password: "passwordlunga123", role: "x" }), /Administrator only/);
    await fails(me.mutation(api.dedupe.renamePerson, { leadIds: [], clientIds: [], name: "x" }), /Administrator only/);
    await fails(me.query(api.dedupe.findGroups, {}), /Administrator only/);
    await fails(me.mutation(api.portalImport.run, { payload: { clients: [] }, dryRun: true }), /Administrator only/);
    await fails(me.mutation(api.migrations.backfillClientsFromWonLeads, {}), /Administrator only/);
    await fails(me.mutation(api.announcements.create, { text: "t", bgColor: "#000", textColor: "#fff", order: 1 } as never), /Administrator only/);
    await fails(me.query(api.activityLogs.list, { limit: 5 }), /Administrator only/);
    await fails(me.mutation(api.users.updateUser, { id: (await idOf(t, "10009")) as never, role: "Founder" }), /Administrator only/);
  });

  it("l'amministratore e' riconosciuto dal token, non da un argomento", async () => {
    const t = convexTest(schema, modules);
    const adminId = await idOf(t, "00001", "ceo");
    const impostor = as(t, await idOf(t, "10003"));
    // Prima bastava scrivere adminUserId: "00001": ora e' ignorato.
    await fails(impostor.mutation(api.users.createUser, { adminUserId: "00001", name: "a", surname: "b", password: "passwordlunga123", role: "x" }), /Administrator only/);
    const id = await as(t, adminId).mutation(api.users.createUser, { name: "Nuovo", surname: "Utente", password: "passwordlunga123", role: "Setter" });
    expect(id).toMatch(/^\d{5}$/);
    await fails(as(t, adminId).mutation(api.users.createUser, { name: "a", surname: "b", password: "corta", role: "x" }), /at least 10/);
  });

  it("non si puo' agire a nome di un altro utente", async () => {
    const t = convexTest(schema, modules);
    const a = await idOf(t, "10004");
    await idOf(t, "10005");
    const me = as(t, a);
    await fails(me.query(api.notifications.listForUser, { userId: "10005" }), /Forbidden/);
    await fails(me.query(api.conversations.listForUser, { userId: "10005" }), /Forbidden/);
    await fails(me.mutation(api.activityLogs.log, { userId: "10005", userName: "Altro", action: "x" }), /Forbidden/);
    await fails(me.mutation(api.users.changePassword, { userId: "10005", currentPassword: "a", newPassword: "passwordlunga123" }), /Forbidden/);
    await me.query(api.notifications.listForUser, { userId: "10004" }); // il proprio: ok
  });

  it("l'autore dei log e' quello del token anche se il browser dichiara un altro nome", async () => {
    const t = convexTest(schema, modules);
    const me = as(t, await idOf(t, "10006"));
    const lead = { leadName: "L", company: "C", email: "", phone: "", source: "s", setterName: "", closerName: "", leadStatus: "New", dateCreated: "2026-01-01", offerMade: false, depositAmount: 0, totalDealValue: 0, cashCollected: 0, refundClawbackAmount: 0, commissionPercent: 0 };
    await me.mutation(api.leads.create, { ...lead, _userId: "00001", _userName: "Stefan Falso" });
    const logs = await t.run((ctx) => ctx.db.query("activityLogs").collect());
    expect(logs[0]).toMatchObject({ userId: "10006", userName: "N10006 S" });
  });
});

describe("login e password", () => {
  let privateJwk: string;
  let publicKey: CryptoKey;
  beforeAll(async () => {
    const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
    privateJwk = JSON.stringify(await crypto.subtle.exportKey("jwk", pair.privateKey));
    publicKey = pair.publicKey;
  });

  const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

  it("emette un token RS256 valido, scade in 3 ore e migra l'hash vecchio a PBKDF2", async () => {
    process.env.CRM_JWT_PRIVATE_JWK = privateJwk;
    const t = convexTest(schema, modules);
    // utente con hash "vecchio stile" (SHA-256 semplice) per la password «vecchia-password»
    const salt = "abcd";
    const legacy = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("vecchia-password" + salt)))).map((x) => x.toString(16).padStart(2, "0")).join("");
    const uid = await t.run((ctx) => ctx.db.insert("users", { userId: "20001", name: "A", surname: "B", passwordHash: legacy, salt, role: "x", createdAt: "x" }));

    expect(await t.mutation(api.users.login, { userId: "20001", password: "sbagliata" })).toEqual({ ok: false, error: "Invalid credentials" });
    const res = await t.mutation(api.users.login, { userId: "20001", password: "vecchia-password" });
    if (!res.ok) throw new Error("login failed");
    const [h, p, sig] = res.token.split(".");
    const header = JSON.parse(new TextDecoder().decode(b64(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64(p)));
    expect(header).toMatchObject({ alg: "RS256" });
    expect(payload).toMatchObject({ iss: "core829-crm", aud: "core829-crm-app", sub: uid, userId: "20001" });
    expect(payload.exp - payload.iat).toBe(3 * 60 * 60);
    expect(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, b64(sig), new TextEncoder().encode(`${h}.${p}`))).toBe(true);
    expect(JSON.stringify(res)).not.toContain("passwordHash");

    const after = await t.run((ctx) => ctx.db.get(uid));
    expect(after?.passwordHash.startsWith("pbkdf2$")).toBe(true);
    // la stessa password continua a funzionare con il nuovo hash
    await t.mutation(api.users.login, { userId: "20001", password: "vecchia-password" });
  });

  it("senza chiave configurata il login non emette nulla (si chiude)", async () => {
    delete process.env.CRM_JWT_PRIVATE_JWK;
    const t = convexTest(schema, modules);
    await t.run((ctx) => ctx.db.insert("users", { userId: "20002", name: "A", surname: "B", passwordHash: "x", salt: "y", role: "x", createdAt: "x" }));
    expect((await t.mutation(api.users.login, { userId: "20002", password: "qualunque" })).ok).toBe(false);
  });

  it("dopo 5 tentativi sbagliati il login si blocca", async () => {
    process.env.CRM_JWT_PRIVATE_JWK = privateJwk;
    const t = convexTest(schema, modules);
    await t.run((ctx) => ctx.db.insert("users", { userId: "20003", name: "A", surname: "B", passwordHash: "x", salt: "y", role: "x", createdAt: "x" }));
    for (let i = 0; i < 5; i++) expect((await t.mutation(api.users.login, { userId: "20003", password: "no" })).ok).toBe(false);
    await fails(t.mutation(api.users.login, { userId: "20003", password: "no" }), /Too many login attempts/);
  });
});
