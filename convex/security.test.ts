/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
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
    // Le uniche tre che non richiedono un utente connesso si autenticano con credenziali/segreto di sessione.
    expect(open.sort()).toEqual(["./sessions.ts:mint", "./sessions.ts:revoke", "./users.ts:login"]);
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

describe("sessioni (cookie HttpOnly) e token brevi", () => {
  let privateJwk: string;
  let publicKey: CryptoKey;
  beforeAll(async () => {
    const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
    privateJwk = JSON.stringify(await crypto.subtle.exportKey("jwk", pair.privateKey));
    publicKey = pair.publicKey;
  });
  beforeEach(() => {
    process.env.CRM_JWT_PRIVATE_JWK = privateJwk;
  });

  const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const legacyUser = async (t: ReturnType<typeof convexTest>, userId: string, password: string) => {
    const salt = "abcd";
    const legacy = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password + salt)))).map((x) => x.toString(16).padStart(2, "0")).join("");
    return t.run((ctx) => ctx.db.insert("users", { userId, name: "A", surname: "B", passwordHash: legacy, salt, role: "x", createdAt: "x" }));
  };
  const login = async (t: ReturnType<typeof convexTest>, userId: string, password: string) => {
    const r = await t.mutation(api.users.login, { userId, password });
    if (!r.ok) throw new Error("login failed");
    return r;
  };

  it("il login non restituisce nessun token: solo il segreto del cookie, e nel database ne resta solo l'hash", async () => {
    const t = convexTest(schema, modules);
    const uid = await legacyUser(t, "20001", "vecchia-password");
    expect(await t.mutation(api.users.login, { userId: "20001", password: "sbagliata" })).toEqual({ ok: false, error: "Invalid credentials" });
    const r = await login(t, "20001", "vecchia-password");
    expect(r.sessionSecret.length).toBeGreaterThanOrEqual(43);
    expect(r.maxAgeSeconds).toBe(8 * 60 * 60);
    expect(JSON.stringify(r)).not.toMatch(/token|passwordHash/);
    const rows = await t.run((ctx) => ctx.db.query("sessions").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(uid);
    expect(JSON.stringify(rows[0])).not.toContain(r.sessionSecret);
    // l'hash vecchio e' stato migrato a PBKDF2
    expect((await t.run((ctx) => ctx.db.get(uid)))?.passwordHash.startsWith("pbkdf2$")).toBe(true);
    await login(t, "20001", "vecchia-password");
  });

  it("mint: con il segreto giusto rilascia un token RS256 che dura 10 minuti e porta l'id sessione", async () => {
    const t = convexTest(schema, modules);
    const uid = await legacyUser(t, "20002", "pw-lunga-123456");
    const r = await login(t, "20002", "pw-lunga-123456");
    const m = await t.mutation(api.sessions.mint, { secret: r.sessionSecret });
    if (!m) throw new Error("mint failed");
    const [h, p, sig] = m.token.split(".");
    const payload = JSON.parse(new TextDecoder().decode(b64(p)));
    expect(JSON.parse(new TextDecoder().decode(b64(h)))).toMatchObject({ alg: "RS256" });
    expect(payload).toMatchObject({ iss: "https://b2b.core829.net", aud: "core829-crm-app", sub: uid, userId: "20002" });
    expect(payload.exp - payload.iat).toBe(10 * 60);
    const session = (await t.run((ctx) => ctx.db.query("sessions").collect()))[0];
    expect(payload.sid).toBe(session._id);
    expect(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, b64(sig), new TextEncoder().encode(`${h}.${p}`))).toBe(true);
    expect(m.user).toMatchObject({ userId: "20002" });
    expect(JSON.stringify(m.user)).not.toMatch(/passwordHash|salt/);
  });

  it("mint rifiuta segreti sbagliati, scaduti, revocati o di utenti eliminati", async () => {
    const t = convexTest(schema, modules);
    const uid = await legacyUser(t, "20003", "pw-lunga-123456");
    expect(await t.mutation(api.sessions.mint, { secret: "x".repeat(43) })).toBeNull();
    expect(await t.mutation(api.sessions.mint, { secret: "corto" })).toBeNull();
    const a = await login(t, "20003", "pw-lunga-123456");
    // scaduta
    await t.run(async (ctx) => { const s = (await ctx.db.query("sessions").collect())[0]; await ctx.db.patch(s._id, { expiresAt: Date.now() - 1 }); });
    expect(await t.mutation(api.sessions.mint, { secret: a.sessionSecret })).toBeNull();
    // revocata (logout)
    const b = await login(t, "20003", "pw-lunga-123456");
    expect(await t.mutation(api.sessions.mint, { secret: b.sessionSecret })).not.toBeNull();
    await t.mutation(api.sessions.revoke, { secret: b.sessionSecret });
    expect(await t.mutation(api.sessions.mint, { secret: b.sessionSecret })).toBeNull();
    // utente eliminato
    const c = await login(t, "20003", "pw-lunga-123456");
    await t.run((ctx) => ctx.db.delete(uid));
    expect(await t.mutation(api.sessions.mint, { secret: c.sessionSecret })).toBeNull();
  });

  it("cambio password: chiude le sessioni degli altri dispositivi, non quella in uso", async () => {
    const t = convexTest(schema, modules);
    const uid = await legacyUser(t, "20004", "pw-lunga-123456");
    const mine = await login(t, "20004", "pw-lunga-123456");
    const other = await login(t, "20004", "pw-lunga-123456");
    const minted = await t.mutation(api.sessions.mint, { secret: mine.sessionSecret });
    const payload = JSON.parse(new TextDecoder().decode(b64(minted!.token.split(".")[1])));
    const asMe = t.withIdentity({ subject: uid, issuer: "https://test.local", tokenIdentifier: `https://test.local|${uid}`, sid: payload.sid });
    const res = await asMe.mutation(api.users.changePassword, { userId: "20004", currentPassword: "pw-lunga-123456", newPassword: "nuova-password-456" });
    expect(res).toEqual({ ok: true });
    expect(await t.mutation(api.sessions.mint, { secret: other.sessionSecret })).toBeNull();
    expect(await t.mutation(api.sessions.mint, { secret: mine.sessionSecret })).not.toBeNull();
  });

  it("reimpostazione della password da parte dell'amministratore: l'utente viene scollegato", async () => {
    const t = convexTest(schema, modules);
    const adminId = await idOf(t, "00001", "ceo");
    const uid = await legacyUser(t, "20005", "pw-lunga-123456");
    const s = await login(t, "20005", "pw-lunga-123456");
    await as(t, adminId).mutation(api.users.updateUser, { id: uid, password: "password-nuova-789" });
    expect(await t.mutation(api.sessions.mint, { secret: s.sessionSecret })).toBeNull();
  });

  it("la chiave privata puo' essere in base64 (nessun problema di virgolette) e una chiave rovinata da' un errore chiaro", async () => {
    const t = convexTest(schema, modules);
    await legacyUser(t, "20008", "pw-lunga-123456");
    const r = await login(t, "20008", "pw-lunga-123456");
    process.env.CRM_JWT_PRIVATE_JWK = btoa(privateJwk);
    expect(await t.mutation(api.sessions.mint, { secret: r.sessionSecret })).not.toBeNull();
    process.env.CRM_JWT_PRIVATE_JWK = "{kty:RSA,n:abc}"; // virgolette perse dalla shell
    await expect(t.mutation(api.sessions.mint, { secret: r.sessionSecret })).rejects.toThrow(/malformed/);
  });

  it("senza chiave configurata non si rilascia nessun token (si chiude)", async () => {
    const t = convexTest(schema, modules);
    await legacyUser(t, "20006", "pw-lunga-123456");
    const r = await login(t, "20006", "pw-lunga-123456");
    delete process.env.CRM_JWT_PRIVATE_JWK;
    await expect(t.mutation(api.sessions.mint, { secret: r.sessionSecret })).rejects.toThrow(/not configured/);
  });

  it("dopo 5 tentativi sbagliati il login si blocca", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => ctx.db.insert("users", { userId: "20003x", name: "A", surname: "B", passwordHash: "x", salt: "y", role: "x", createdAt: "x" }));
    for (let i = 0; i < 5; i++) expect((await t.mutation(api.users.login, { userId: "20003x", password: "no" })).ok).toBe(false);
    await fails(t.mutation(api.users.login, { userId: "20003x", password: "no" }), /Too many login attempts/);
  });

  it("la pulizia elimina solo le sessioni scadute", async () => {
    const t = convexTest(schema, modules);
    await legacyUser(t, "20007", "pw-lunga-123456");
    await login(t, "20007", "pw-lunga-123456");
    await login(t, "20007", "pw-lunga-123456");
    await t.run(async (ctx) => { const s = (await ctx.db.query("sessions").collect())[0]; await ctx.db.patch(s._id, { expiresAt: 1 }); });
    const { internal } = await import("./_generated/api");
    expect(await t.mutation(internal.sessions.purgeExpired, {})).toBe(1);
    expect(await t.run((ctx) => ctx.db.query("sessions").collect())).toHaveLength(1);
  });
});
