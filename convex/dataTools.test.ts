/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/** Un'istanza di test con l'amministratore (00001) gia' collegato: le funzioni ora richiedono un utente valido. */
function makeApp() {
  const t = convexTest(schema, modules);
  let adminId: string | undefined;
  const ready = t.run(async (ctx) => {
    adminId = await ctx.db.insert("users", { userId: "00001", name: "A", surname: "B", passwordHash: "x", salt: "y", role: "admin", createdAt: "x" });
  });
  return Object.assign(t, {
    async admin() {
      await ready;
      return t.withIdentity({ subject: adminId!, issuer: "https://test.local", tokenIdentifier: `https://test.local|${adminId}` });
    },
  });
}

const lead = (name: string, company: string, email = "") => ({
  leadName: name, company, email, phone: "", source: "x", setterName: "", closerName: "", leadStatus: "New", dateCreated: "2026-01-01",
  offerMade: false, depositAmount: 0, totalDealValue: 0, cashCollected: 0, refundClawbackAmount: 0, commissionPercent: 0, earnings: 0,
});
const client = (name: string, company: string, email = "") => ({ clientName: name, company, email, phone: "", createdAt: "2026-01-01" });

describe("duplicati", () => {
  it("trova il nome scritto in due modi e unisce senza perdere progetti", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const { a, b } = await t.run(async (ctx) => {
      const a = await ctx.db.insert("clients", client("Dimitri Bouterline", "Studio D"));
      const b = await ctx.db.insert("clients", { ...client("Dimitri Boutourline", "Studio D", "d@x.it"), website: "https://x.it" });
      await ctx.db.insert("projects", { clientId: a, projectName: "Sito", description: "", status: "Active", startDate: "2026-01-01", totalValue: 100, createdAt: "x" });
      await ctx.db.insert("services", { clientId: b, category: "c", serviceName: "Hosting", quoteAmount: 5, status: "Pending", createdAt: "x" });
      return { a, b };
    });
    const groups = await adm.query(api.dedupe.findGroups, {});
    expect(groups.clients).toHaveLength(1);
    const res = await adm.mutation(api.dedupe.mergeClients, { keepId: b, removeIds: [a], canonicalName: "Dimitri Boutourline" });
    expect(res.moved).toBe(1);
    const after = await t.run(async (ctx) => ({
      clients: await ctx.db.query("clients").collect(),
      projects: await ctx.db.query("projects").collect(),
      services: await ctx.db.query("services").collect(),
    }));
    expect(after.clients).toHaveLength(1);
    expect(after.clients[0].clientName).toBe("Dimitri Boutourline");
    expect(after.projects[0].clientId).toBe(b);
    expect(after.services[0].clientId).toBe(b);
  });

  it("unisce i lead spostando i clienti collegati; non tocca gli altri lead", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const ids = await t.run(async (ctx) => {
      const k = await ctx.db.insert("leads", lead("Anna Verdi", "", ""));
      const d = await ctx.db.insert("leads", lead("Anna Verdi", "Verdi Srl", "a@v.it"));
      const other = await ctx.db.insert("leads", lead("Paolo Neri", "Neri"));
      const c = await ctx.db.insert("clients", { ...client("Anna Verdi", "Verdi Srl"), leadId: d });
      return { k, d, other, c };
    });
    await adm.mutation(api.dedupe.mergeLeads, { keepId: ids.k, removeIds: [ids.d] });
    const after = await t.run(async (ctx) => ({ leads: await ctx.db.query("leads").collect(), c: await ctx.db.get(ids.c) }));
    expect(after.leads.map((l) => l.leadName).sort()).toEqual(["Anna Verdi", "Paolo Neri"]);
    expect(after.leads.find((l) => l._id === ids.k)?.email).toBe("a@v.it"); // campo vuoto completato
    expect(after.c?.leadId).toBe(ids.k);
  });
});

describe("eliminazione", () => {
  it("elimina un cliente con tutto, senza toccare il lead", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const { c, l } = await t.run(async (ctx) => {
      const l = await ctx.db.insert("leads", lead("Zeta Test", "Z"));
      const c = await ctx.db.insert("clients", { ...client("Zeta Test", "Z"), leadId: l });
      const p = await ctx.db.insert("projects", { clientId: c, projectName: "P", description: "", status: "Active", startDate: "x", totalValue: 0, createdAt: "x" });
      await ctx.db.insert("projectTasks", { projectId: p, taskName: "t", completed: false, createdAt: "x" });
      await ctx.db.insert("invoices", { projectId: p, invoiceNumber: "1", amount: 1, status: "Paid", createdAt: "x" });
      await ctx.db.insert("services", { clientId: c, category: "c", serviceName: "s", quoteAmount: 1, status: "Pending", createdAt: "x" });
      return { c, l };
    });
    await adm.mutation(api.clients.remove, { id: c });
    const left = await t.run(async (ctx) => ({
      clients: (await ctx.db.query("clients").collect()).length, projects: (await ctx.db.query("projects").collect()).length,
      tasks: (await ctx.db.query("projectTasks").collect()).length, invoices: (await ctx.db.query("invoices").collect()).length,
      services: (await ctx.db.query("services").collect()).length, lead: await ctx.db.get(l),
    }));
    expect(left).toMatchObject({ clients: 0, projects: 0, tasks: 0, invoices: 0, services: 0 });
    expect(left.lead).not.toBeNull();
  });

  it("eliminare un progetto elimina anche attivita' e fatture", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const p = await t.run(async (ctx) => {
      const c = await ctx.db.insert("clients", client("A B", "C"));
      const p = await ctx.db.insert("projects", { clientId: c, projectName: "P", description: "", status: "Active", startDate: "x", totalValue: 0, createdAt: "x" });
      await ctx.db.insert("projectTasks", { projectId: p, taskName: "t", completed: false, createdAt: "x" });
      await ctx.db.insert("invoices", { projectId: p, invoiceNumber: "1", amount: 1, status: "Paid", createdAt: "x" });
      return p;
    });
    await adm.mutation(api.projects.remove, { id: p });
    expect(await t.run(async (ctx) => (await ctx.db.query("projectTasks").collect()).length + (await ctx.db.query("invoices").collect()).length)).toBe(0);
  });

  it("eliminare un lead scollega il cliente ma lo lascia", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const { l, c } = await t.run(async (ctx) => {
      const l = await ctx.db.insert("leads", lead("Q R", "S"));
      const c = await ctx.db.insert("clients", { ...client("Q R", "S"), leadId: l });
      return { l, c };
    });
    await adm.mutation(api.leads.remove, { id: l });
    const cl = await t.run((ctx) => ctx.db.get(c));
    expect(cl).not.toBeNull();
    expect(cl?.leadId).toBeUndefined();
  });
});

const portal = (over: Record<string, unknown> = {}) => ({
  clients: [{
    ref: "pc1", displayName: "Studio D", contactName: "Dimitri Boutourline", email: "d@x.it", phone: "+39 333 1112223", website: "https://x.it",
    projects: [{ ref: "pp1", name: "Sito web", status: "in_progress" }],
    invoices: [
      { ref: "pi1", number: "2026/001", amountCents: 9000, status: "paid", projectRef: "pp1", issuedAt: 1760000000000 },
      { ref: "pi2", number: "2026/002", amountCents: 5000, status: "sent", issuedAt: 1760000000000 },
      { ref: "pi3", number: "2026/003", amountCents: 100, status: "draft", issuedAt: 1760000000000 },
    ],
    subscriptions: [{ ref: "ps1", name: "Hosting", amountCents: 3000, interval: "month", status: "active" }],
    ...over,
  }],
});

describe("importazione dal portale", () => {
  it("anteprima non scrive; import crea tutto; secondo import non duplica", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const dry = await adm.mutation(api.portalImport.run, { payload: portal(), dryRun: true });
    expect(dry).toMatchObject({ clientsCreated: 1, projectsCreated: 1, invoicesCreated: 2, invoicesSkippedDraft: 1, servicesCreated: 1 });
    expect(await t.run(async (ctx) => (await ctx.db.query("clients").collect()).length)).toBe(0);

    await adm.mutation(api.portalImport.run, { payload: portal(), dryRun: false });
    const count = () => t.run(async (ctx) => ({ c: (await ctx.db.query("clients").collect()).length, p: (await ctx.db.query("projects").collect()).length, i: (await ctx.db.query("invoices").collect()).length, s: (await ctx.db.query("services").collect()).length }));
    expect(await count()).toEqual({ c: 1, p: 2, i: 2, s: 1 }); // 2 progetti: «Sito web» + «General billing»
    const again = await adm.mutation(api.portalImport.run, { payload: portal(), dryRun: false });
    expect(again).toMatchObject({ clientsCreated: 0, clientsMatched: 1, invoicesCreated: 0, projectsCreated: 0, servicesCreated: 0 });
    expect(await count()).toEqual({ c: 1, p: 2, i: 2, s: 1 });
  });

  it("riconosce il cliente gia' presente scritto diversamente, lo completa e non tocca i lead", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const leadId = await t.run(async (ctx) => {
      await ctx.db.insert("leads", lead("Qualcun Altro", "Altra Srl"));
      const l = await ctx.db.insert("leads", lead("Dimitri Bouterline", "Studio D", "d@x.it"));
      await ctx.db.insert("clients", client("Dimitri Bouterline", "Studio D"));
      return l;
    });
    const r = await adm.mutation(api.portalImport.run, { payload: portal(), dryRun: false });
    expect(r).toMatchObject({ clientsCreated: 0, clientsMatched: 1, clientsCompleted: 1, leadsLinked: 1 });
    expect(r.nameConflicts).toEqual([{ crm: "Dimitri Bouterline", portal: "Dimitri Boutourline", renamed: false }]);
    const state = await t.run(async (ctx) => ({ clients: await ctx.db.query("clients").collect(), leads: (await ctx.db.query("leads").collect()).length }));
    expect(state.leads).toBe(2); // nessun lead eliminato
    expect(state.clients).toHaveLength(1);
    expect(state.clients[0]).toMatchObject({ clientName: "Dimitri Bouterline", email: "d@x.it", website: "https://x.it", leadId });
    // con «usa il nome del portale» il nome viene corretto
    await adm.mutation(api.portalImport.run, { payload: portal(), dryRun: false, preferPortalNames: true });
    expect((await t.run((ctx) => ctx.db.query("clients").first()))?.clientName).toBe("Dimitri Boutourline");
  });

  it("rifiuta un file non valido", async () => {
    const t = makeApp();
    const adm = await t.admin();
    await expect(adm.mutation(api.portalImport.run, { payload: { foo: 1 }, dryRun: true })).rejects.toThrow(/Invalid file/);
  });
});

describe("backup completo", () => {
  const seed = (t: ReturnType<typeof makeApp>) =>
    t.run(async (ctx) => {
      const l = await ctx.db.insert("leads", lead("Dimitri Boutourline", "Studio D", "d@x.it"));
      await ctx.db.insert("leads", lead("Anna Verdi", "Verdi Srl", "a@v.it"));
      const c = await ctx.db.insert("clients", { ...client("Dimitri Boutourline", "Studio D", "d@x.it"), leadId: l });
      const p = await ctx.db.insert("projects", { clientId: c, projectName: "Sito", description: "d", status: "Active", startDate: "2026-01-01", totalValue: 500, createdAt: "x" });
      await ctx.db.insert("projectTasks", { projectId: p, taskName: "Home", completed: true, createdAt: "x" });
      await ctx.db.insert("invoices", { projectId: p, invoiceNumber: "F1", amount: 100, status: "Paid", createdAt: "x" });
      await ctx.db.insert("services", { clientId: c, category: "Hosting & Infrastructure", serviceName: "Hosting", quoteAmount: 30, status: "Accepted", createdAt: "x" });
    });

  it("esporta tutto, ripristina in un database vuoto e un secondo ripristino non duplica", async () => {
    const a = makeApp();
    const admA = await a.admin();
    await seed(a);
    const file = JSON.parse(JSON.stringify(await admA.query(api.backup.exportAll, {})));
    expect(file.format).toBe("core829-crm-export/1");
    expect(file.leads).toHaveLength(2);
    expect(file.clients[0].projects[0].invoices[0].invoiceNumber).toBe("F1");

    const b = makeApp();
    const admB = await b.admin();
    const dry = await admB.mutation(api.backup.restore, { payload: file, dryRun: true });
    expect(dry).toMatchObject({ leadsCreated: 2, clientsCreated: 1, projectsCreated: 1, invoicesCreated: 1, servicesCreated: 1 });
    expect(await b.run(async (ctx) => (await ctx.db.query("leads").collect()).length)).toBe(0); // l'anteprima non scrive
    await admB.mutation(api.backup.restore, { payload: file, dryRun: false });
    const state = () => b.run(async (ctx) => ({ l: (await ctx.db.query("leads").collect()).length, c: (await ctx.db.query("clients").collect()).length, p: (await ctx.db.query("projects").collect()).length, i: (await ctx.db.query("invoices").collect()).length, s: (await ctx.db.query("services").collect()).length, t: (await ctx.db.query("projectTasks").collect()).length }));
    expect(await state()).toEqual({ l: 2, c: 1, p: 1, i: 1, s: 1, t: 1 });
    const again = await admB.mutation(api.backup.restore, { payload: file, dryRun: false });
    expect(again).toMatchObject({ leadsCreated: 0, clientsCreated: 0, projectsCreated: 0, invoicesCreated: 0, servicesCreated: 0 });
    expect(await state()).toEqual({ l: 2, c: 1, p: 1, i: 1, s: 1, t: 1 });
    // il cliente ripristinato resta collegato al suo lead
    const link = await b.run(async (ctx) => { const c = (await ctx.db.query("clients").collect())[0]; return c.leadId ? (await ctx.db.get(c.leadId))?.leadName : null; });
    expect(link).toBe("Dimitri Boutourline");
  });

  it("non cancella nulla e non duplica un lead scritto in modo leggermente diverso", async () => {
    const t = makeApp();
    const adm = await t.admin();
    await t.run(async (ctx) => { await ctx.db.insert("leads", lead("Dimitri Bouterline", "Studio D", "d@x.it")); await ctx.db.insert("leads", lead("Altro Lead", "Altra")); });
    const file = { format: "core829-crm-export/1", leads: [{ ref: "1", ...lead("Dimitri Boutourline", "Studio D", "d@x.it") }], clients: [] };
    const r = await adm.mutation(api.backup.restore, { payload: file, dryRun: false });
    expect(r).toMatchObject({ leadsCreated: 0, leadsExisting: 1 });
    expect(await t.run(async (ctx) => (await ctx.db.query("leads").collect()).length)).toBe(2);
  });

  it("solo l'amministratore; file non valido rifiutato", async () => {
    const t = makeApp();
    const adm = await t.admin();
    await expect(t.mutation(api.backup.restore, { payload: {}, dryRun: true })).rejects.toThrow(/Not authenticated/);
    await expect(adm.mutation(api.backup.restore, { payload: { format: "altro" }, dryRun: true })).rejects.toThrow(/Invalid file/);
  });
});

describe("importazione lead da foglio", () => {
  const L = (o: Record<string, unknown> = {}) => ({ leadName: "Monia", company: "Hostaria Il Buco", email: "", phone: "+39057830230", source: "Google Maps", leadStatus: "Lost", lossReason: "Not Qualified", dateCreated: "2026-11-06", category: "Hospitality & Food", niche: "Restaurant", notes: "n", ...o });

  it("anteprima non scrive; import crea; secondo import salta i presenti; non cancella", async () => {
    const t = makeApp();
    const adm = await t.admin();
    await t.run((ctx) => ctx.db.insert("leads", lead("Lead Preesistente", "Altra Srl", "x@y.it")));
    const rows = [L(), L({ leadName: "Il Rabarbaro", company: "Il Rabarbaro", phone: "+39057864592", leadStatus: "New", lossReason: undefined }), L({ leadName: "", company: "" })];
    const dry = await adm.mutation(api.leadsImport.run, { leads: rows, dryRun: true });
    expect(dry).toMatchObject({ total: 3, created: 2 });
    expect(dry.skippedInvalid).toHaveLength(1);
    expect(await t.run(async (ctx) => (await ctx.db.query("leads").collect()).length)).toBe(1);
    await adm.mutation(api.leadsImport.run, { leads: rows, dryRun: false });
    const all = await t.run((ctx) => ctx.db.query("leads").collect());
    expect(all).toHaveLength(3);
    expect(all.find((x) => x.company === "Hostaria Il Buco")).toMatchObject({ leadStatus: "Lost", lossReason: "Not Qualified", category: "Hospitality & Food", niche: "Restaurant", source: "Google Maps" });
    const again = await adm.mutation(api.leadsImport.run, { leads: rows, dryRun: false });
    expect(again.created).toBe(0);
    expect(again.skippedExisting).toHaveLength(2);
    expect(await t.run(async (ctx) => (await ctx.db.query("leads").collect()).length)).toBe(3);
  });

  it("stesso telefono con nome scritto diversamente = stesso lead; categoria sconosciuta ignorata; solo admin", async () => {
    const t = makeApp();
    const adm = await t.admin();
    await t.run((ctx) => ctx.db.insert("leads", { ...lead("Monia Rossi", "Hostaria Il Buco"), phone: "+39 0578 30230" }));
    const r = await adm.mutation(api.leadsImport.run, { leads: [L(), L({ leadName: "Nuovo", company: "Nuovo Locale", phone: "+39111", category: "Inventata", niche: "x" })], dryRun: false });
    expect(r.created).toBe(1);
    const nuovo = (await t.run((ctx) => ctx.db.query("leads").collect())).find((x) => x.company === "Nuovo Locale");
    expect(nuovo?.category).toBeUndefined();
    expect(nuovo?.niche).toBeUndefined();
    await expect(t.mutation(api.leadsImport.run, { leads: [L()], dryRun: true })).rejects.toThrow(/Not authenticated/);
  });
});

describe("importazione lead: nessun doppione nemmeno dentro il file o tra due file", () => {
  const L = (o: Record<string, unknown> = {}) => ({ leadName: "Monia", company: "Hostaria Il Buco", email: "", phone: "+39057830230", source: "Google Maps", leadStatus: "New", dateCreated: "2026-11-06", ...o });

  it("righe ripetute nello stesso file: anteprima e importazione danno lo stesso risultato", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const rows = [L(), L({ leadName: "Hostaria Il Buco", phone: "0578 30230" }), L({ leadName: "Altro", company: "Altro Locale", phone: "+39111222333" })];
    const dry = await adm.mutation(api.leadsImport.run, { leads: rows, dryRun: true });
    expect(dry.created).toBe(2);
    expect(dry.skippedInFile).toHaveLength(1);
    const real = await adm.mutation(api.leadsImport.run, { leads: rows, dryRun: false });
    expect(real.created).toBe(2);
    expect(await t.run(async (ctx) => (await ctx.db.query("leads").collect()).length)).toBe(2);
  });

  it("importare due versioni dello stesso foglio (una piu' corta) non crea doppioni", async () => {
    const t = makeApp();
    const adm = await t.admin();
    const completo = [L(), L({ leadName: "Il Rabarbaro", company: "Il Rabarbaro", phone: "+39057864592" }), L({ leadName: "Sette Di Vino", company: "Sette Di Vino", phone: "+390578749092" })];
    const corto = completo.slice(0, 2);
    await adm.mutation(api.leadsImport.run, { leads: corto, dryRun: false });
    const r = await adm.mutation(api.leadsImport.run, { leads: completo, dryRun: false });
    expect(r.created).toBe(1);
    expect(r.skippedExisting).toHaveLength(2);
    expect(await t.run(async (ctx) => (await ctx.db.query("leads").collect()).length)).toBe(3);
  });
});
