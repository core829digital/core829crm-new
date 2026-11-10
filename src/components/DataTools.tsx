"use client";

import { useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Loader2, Upload, GitMerge, Copy, Download, ArchiveRestore, FileSpreadsheet } from "lucide-react";
import { parseCsv } from "../../convex/lib/csv";
import { mapSheetRow, type SheetLead } from "../../convex/lib/leadSheet";
import { useAuth } from "@/components/AuthContext";

type Item = { id: string; name: string; company: string; email: string; phone: string };
type Group = { reasons: string[]; items: Item[] };

export default function DataTools() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"dupes" | "import" | "backup" | "leads">("dupes");
  if (user && user.userId !== "00001") return <p className="text-center py-20 text-zinc-500">Only the administrator can use the data tools.</p>;
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Data tools</h1>
      <p className="text-sm text-zinc-500 mb-5">Find and merge duplicate leads/clients, and import everything from the client portal. Nothing here ever deletes a lead unless you confirm a merge.</p>
      <div className="flex gap-2 mb-5" role="tablist">
        {([["dupes", "Duplicates", Copy], ["import", "Import from portal", Upload], ["backup", "Export / Backup", Download], ["leads", "Import leads (CSV)", FileSpreadsheet]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${tab === id ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {tab === "dupes" ? <Duplicates /> : tab === "import" ? <ImportFromPortal /> : tab === "leads" ? <ImportLeadsCsv /> : <BackupTools />}
    </div>
  );
}

function Duplicates() {
  const groups = useQuery(api.dedupe.findGroups, {});
  if (groups === undefined) return <div className="text-zinc-400">Loading…</div>;
  const none = groups.leads.length === 0 && groups.clients.length === 0;
  return (
    <div className="space-y-8">
      {none && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-500">No duplicates found. 🎉</p>}
      {groups.clients.length > 0 && <Section title="Clients that look like the same person / company" kind="client" groups={groups.clients} />}
      {groups.leads.length > 0 && <Section title="Leads that look like the same person / company" kind="lead" groups={groups.leads} />}
    </div>
  );
}

function Section({ title, kind, groups }: { title: string; kind: "client" | "lead"; groups: Group[] }) {
  return (
    <section>
      <h2 className="font-semibold mb-3">{title} <span className="text-zinc-400 font-normal">({groups.length})</span></h2>
      <div className="space-y-3">
        {groups.map((g) => (
          <GroupCard key={g.items.map((i) => i.id).join("-")} kind={kind} group={g} />
        ))}
      </div>
    </section>
  );
}

function GroupCard({ kind, group }: { kind: "client" | "lead"; group: Group }) {
  const mergeClients = useMutation(api.dedupe.mergeClients);
  const mergeLeads = useMutation(api.dedupe.mergeLeads);
  const [keepId, setKeepId] = useState(group.items[0].id);
  const [name, setName] = useState(group.items[0].name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = (id: string) => {
    setKeepId(id);
    setName(group.items.find((i) => i.id === id)?.name ?? name);
  };
  const merge = async () => {
    const removeIds = group.items.map((i) => i.id).filter((id) => id !== keepId);
    if (!window.confirm(`Merge ${group.items.length} records into one named "${name}"? The other ${removeIds.length} will be deleted (their projects and services move to the one you keep). This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      if (kind === "client") await mergeClients({ keepId: keepId as Id<"clients">, removeIds: removeIds as Id<"clients">[], canonicalName: name });
      else await mergeLeads({ keepId: keepId as Id<"leads">, removeIds: removeIds as Id<"leads">[], canonicalName: name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-400 mb-2">Why: {group.reasons.join(", ")}</p>
      <div className="space-y-1.5">
        {group.items.map((i) => (
          <label key={i.id} className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="radio" className="mt-1 accent-red-600" checked={keepId === i.id} onChange={() => pick(i.id)} />
            <span>
              <span className="font-medium">{i.name}</span> <span className="text-zinc-500">{i.company}</span>
              <span className="block text-xs text-zinc-400">{[i.email, i.phone].filter(Boolean).join(" · ") || "no contact data"}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
        <label className="text-xs text-zinc-500 sm:w-40">Correct name to keep</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={merge} disabled={busy || !name.trim()} className="flex items-center justify-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <GitMerge size={15} />} Merge into one
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

type Report = {
  dryRun: boolean; clientsCreated: number; clientsMatched: number; clientsCompleted: number; leadsLinked: number;
  projectsCreated: number; projectsExisting: number; invoicesCreated: number; invoicesExisting: number; invoicesSkippedDraft: number;
  servicesCreated: number; servicesExisting: number;
  nameConflicts: { crm: string; portal: string; renamed: boolean }[];
  matches: { portal: string; crm: string; how: string }[];
};

function ImportFromPortal() {
  const run = useMutation(api.portalImport.run);
  const [payload, setPayload] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [preferPortalNames, setPrefer] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (f: File | undefined) => {
    setReport(null);
    setError("");
    if (!f) return;
    try {
      setPayload(JSON.parse(await f.text()));
      setFileName(f.name);
    } catch {
      setPayload(null);
      setError("This is not a valid portal export file.");
    }
  };
  const go = async (dryRun: boolean) => {
    if (!payload) return;
    if (!dryRun && !window.confirm("Import now? Nothing is deleted; existing clients are only completed. You can run it again safely.")) return;
    setBusy(true);
    setError("");
    try {
      setReport((await run({ payload, dryRun, preferPortalNames })) as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ol className="text-sm text-zinc-600 list-decimal pl-5 space-y-1">
        <li>In the portal (portal.core829.net) open <b>Clienti</b> and press <b>Esporta per il CRM</b>: a file is downloaded.</li>
        <li>Choose that file here and press <b>Preview</b> (nothing is written).</li>
        <li>If the preview looks right, press <b>Import</b>. It is safe to repeat: no duplicates, no deletions.</li>
      </ol>
      <label className="flex items-center gap-2 border border-dashed border-zinc-300 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-zinc-50">
        <Upload size={16} className="text-zinc-400" />
        <span className={fileName ? "text-zinc-800" : "text-zinc-400"}>{fileName || "Choose the portal export (.json)"}</span>
        <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => void load(e.target.files?.[0])} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-red-600" checked={preferPortalNames} onChange={(e) => setPrefer(e.target.checked)} />
        When a name is spelled differently, use the portal spelling
      </label>
      <div className="flex gap-2">
        <button disabled={!payload || busy} onClick={() => void go(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50">Preview</button>
        <button disabled={!payload || busy || !report?.dryRun} onClick={() => void go(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-zinc-800 disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : "Import"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {report && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm space-y-3">
          <p className="font-semibold">{report.dryRun ? "Preview — nothing was written yet" : "Import completed"}</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
            <li>New clients: <b>{report.clientsCreated}</b></li>
            <li>Already in CRM: <b>{report.clientsMatched}</b></li>
            <li>Completed with new data: <b>{report.clientsCompleted}</b></li>
            <li>Linked to existing leads: <b>{report.leadsLinked}</b></li>
            <li>New projects: <b>{report.projectsCreated}</b></li>
            <li>Projects already there: <b>{report.projectsExisting}</b></li>
            <li>New invoices: <b>{report.invoicesCreated}</b></li>
            <li>Invoices already there: <b>{report.invoicesExisting}</b></li>
            <li>Drafts skipped: <b>{report.invoicesSkippedDraft}</b></li>
            <li>New services (subscriptions): <b>{report.servicesCreated}</b></li>
            <li>Services already there: <b>{report.servicesExisting}</b></li>
          </ul>
          {report.nameConflicts.length > 0 && (
            <div>
              <p className="font-medium">Names spelled differently ({report.nameConflicts.length})</p>
              <ul className="list-disc pl-5 text-zinc-600">
                {report.nameConflicts.map((c, i) => (
                  <li key={i}>CRM “{c.crm}” ↔ portal “{c.portal}” {c.renamed ? "— renamed to the portal spelling" : "— left as is (use Duplicates to fix)"}</li>
                ))}
              </ul>
            </div>
          )}
          {report.matches.length > 0 && (
            <details>
              <summary className="cursor-pointer font-medium">Matched clients ({report.matches.length})</summary>
              <ul className="list-disc pl-5 text-zinc-600 mt-1">
                {report.matches.map((m, i) => (
                  <li key={i}>{m.portal} → {m.crm} <span className="text-zinc-400">({m.how})</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

type RestoreReport = {
  dryRun: boolean; leadsCreated: number; leadsExisting: number; clientsCreated: number; clientsExisting: number; projectsCreated: number; projectsExisting: number;
  invoicesCreated: number; invoicesExisting: number; servicesCreated: number; servicesExisting: number; tasksCreated: number;
};

/** Esporta tutto in un file (backup, e anche per il portale) e ripristina da un backup senza creare doppioni. */
function BackupTools() {
  const convex = useConvex();
  const restore = useMutation(api.backup.restore);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [payload, setPayload] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<RestoreReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const doExport = async () => {
    setExporting(true);
    setExportMsg("");
    try {
      const data = await convex.query(api.backup.exportAll, {});
      const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg(`Downloaded: ${data.leads.length} leads, ${data.clients.length} clients.${data.truncated ? " WARNING: too much data, the file is incomplete." : ""}`);
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };
  const load = async (f: File | undefined) => {
    setReport(null);
    setError("");
    if (!f) return;
    try {
      setPayload(JSON.parse(await f.text()));
      setFileName(f.name);
    } catch {
      setPayload(null);
      setError("This is not a valid backup file.");
    }
  };
  const go = async (dryRun: boolean) => {
    if (!payload) return;
    if (!dryRun && !window.confirm("Restore now? Nothing is deleted; records already present are not duplicated. You can run it again safely.")) return;
    setBusy(true);
    setError("");
    try {
      setReport((await restore({ payload, dryRun })) as RestoreReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="font-semibold">Export everything</h2>
        <p className="text-sm text-zinc-500">One file with all leads, clients, projects, tasks, invoices and services. Use it as a <b>backup</b>, and in the portal (<b>Clienti → Importa dal CRM</b>) to keep the two systems connected. It contains personal data: keep it private, never put it on GitHub.</p>
        <button onClick={() => void doExport()} disabled={exporting} className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download backup (.json)
        </button>
        {exportMsg && <p role="status" className="text-sm text-zinc-600">{exportMsg}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Restore from a backup</h2>
        <p className="text-sm text-zinc-500">Choose a backup file, press <b>Preview</b> (nothing is written), then <b>Restore</b>. Leads and clients already present (same email, phone or name) are recognised and not duplicated. Nothing is ever deleted.</p>
        <label className="flex items-center gap-2 border border-dashed border-zinc-300 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-zinc-50">
          <Upload size={16} className="text-zinc-400" />
          <span className={fileName ? "text-zinc-800" : "text-zinc-400"}>{fileName || "Choose the backup file (.json)"}</span>
          <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => void load(e.target.files?.[0])} />
        </label>
        <div className="flex gap-2">
          <button disabled={!payload || busy} onClick={() => void go(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50">Preview</button>
          <button disabled={!payload || busy || !report?.dryRun} onClick={() => void go(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-zinc-800 disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ArchiveRestore size={15} />} Restore
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {report && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm space-y-2">
            <p className="font-semibold">{report.dryRun ? "Preview — nothing was written yet" : "Restore completed"}</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
              <li>New leads: <b>{report.leadsCreated}</b></li>
              <li>Leads already there: <b>{report.leadsExisting}</b></li>
              <li>New clients: <b>{report.clientsCreated}</b></li>
              <li>Clients already there: <b>{report.clientsExisting}</b></li>
              <li>New projects: <b>{report.projectsCreated}</b></li>
              <li>Projects already there: <b>{report.projectsExisting}</b></li>
              <li>New invoices: <b>{report.invoicesCreated}</b></li>
              <li>Invoices already there: <b>{report.invoicesExisting}</b></li>
              <li>New services: <b>{report.servicesCreated}</b></li>
              <li>Services already there: <b>{report.servicesExisting}</b></li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

type LeadsReport = { dryRun: boolean; total: number; created: number; skippedExisting: string[]; skippedInvalid: string[] };

/** Importa i lead da un foglio Google (File → Scarica → CSV, scheda «Lead»). Anteprima, nessun doppione, nessuna cancellazione. */
function ImportLeadsCsv() {
  const run = useMutation(api.leadsImport.run);
  const [rows, setRows] = useState<SheetLead[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<LeadsReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (f: File | undefined) => {
    setReport(null);
    setError("");
    if (!f) return;
    try {
      const parsed = parseCsv(await f.text());
      const today = new Date().toISOString().slice(0, 10);
      const mapped = parsed.map((r) => mapSheetRow(r, today)).filter((x): x is SheetLead => x !== null);
      if (mapped.length === 0) throw new Error("empty");
      setRows(mapped);
      setFileName(f.name);
    } catch {
      setRows(null);
      setFileName("");
      setError("No leads found. Download the sheet «Lead» as CSV (Google Sheets: File → Download → Comma-separated values) and choose that file.");
    }
  };
  const go = async (dryRun: boolean) => {
    if (!rows) return;
    if (!dryRun && !window.confirm(`Import ${rows.length} leads now? Nothing is deleted; leads already present are skipped.`)) return;
    setBusy(true);
    setError("");
    try {
      setReport((await run({ leads: rows, dryRun })) as LeadsReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ol className="text-sm text-zinc-600 list-decimal pl-5 space-y-1">
        <li>In Google Sheets open the lead sheet (tab <b>Lead</b>) and choose <b>File → Download → Comma-separated values (.csv)</b>.</li>
        <li>Choose that file here: you will see how many leads were found.</li>
        <li>Press <b>Preview</b> (nothing is written), then <b>Import</b>. Leads already in the CRM (same phone, email or similar name) are skipped.</li>
      </ol>
      <label className="flex items-center gap-2 border border-dashed border-zinc-300 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-zinc-50">
        <Upload size={16} className="text-zinc-400" />
        <span className={fileName ? "text-zinc-800" : "text-zinc-400"}>{fileName ? `${fileName} — ${rows?.length ?? 0} leads found` : "Choose the CSV file"}</span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void load(e.target.files?.[0])} />
      </label>
      <div className="flex gap-2">
        <button disabled={!rows || busy} onClick={() => void go(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50">Preview</button>
        <button disabled={!rows || busy || !report?.dryRun} onClick={() => void go(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-zinc-800 disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : "Import"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {report && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm space-y-2">
          <p className="font-semibold">{report.dryRun ? "Preview — nothing was written yet" : "Import completed"}</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
            <li>In the file: <b>{report.total}</b></li>
            <li>{report.dryRun ? "To create" : "Created"}: <b>{report.created}</b></li>
            <li>Already in the CRM: <b>{report.skippedExisting.length}</b></li>
            <li>Invalid rows: <b>{report.skippedInvalid.length}</b></li>
          </ul>
          {report.skippedExisting.length > 0 && (
            <details>
              <summary className="cursor-pointer font-medium">Skipped: already present</summary>
              <ul className="list-disc pl-5 text-zinc-600 mt-1">{report.skippedExisting.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
