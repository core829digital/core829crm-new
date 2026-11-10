/**
 * Riconoscimento dei doppioni (stessa persona/azienda scritta in modi diversi, es. un nome con una lettera sbagliata).
 * Funzioni pure, senza dipendenze: si possono provare da sole.
 */

/** Minuscolo, senza accenti, senza punteggiatura, spazi singoli. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parole in ordine alfabetico: «Rossi Mario» = «Mario Rossi». */
const sortedTokens = (s: string) => normalizeName(s).split(" ").filter(Boolean).sort().join(" ");

/** Distanza di Damerau-Levenshtein (scambio di due lettere conta 1). */
export function editDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const d: number[][] = Array.from({ length: al + 1 }, () => new Array<number>(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) d[i][0] = i;
  for (let j = 0; j <= bl; j++) d[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[al][bl];
}

/** Due nomi sembrano la stessa persona/azienda? Prudente: richiede almeno due parole oppure un nome lungo. */
export function sameName(a: string, b: string): boolean {
  const ta = sortedTokens(a);
  const tb = sortedTokens(b);
  if (!ta || !tb) return false;
  if (ta === tb) return true;
  const longest = Math.max(ta.length, tb.length);
  // Nomi corti: solo uguaglianza (Mario/Maria sono persone diverse). Piu' il nome e' lungo, piu' errori di battitura si tollerano.
  const limit = longest >= 18 ? 2 : longest >= 12 ? 1 : 0;
  return editDistance(ta, tb) <= limit;
}

export const normalizeEmail = (s: string) => s.trim().toLowerCase();
export const phoneDigits = (s: string) => s.replace(/\D/g, "");

export type Person = { id: string; name: string; company?: string; email?: string; phone?: string };

/** Perche' due record sembrano lo stesso (vuoto = no). */
export function matchReason(a: Person, b: Person): string | null {
  const ea = normalizeEmail(a.email ?? "");
  const eb = normalizeEmail(b.email ?? "");
  if (ea && ea === eb) return "same email";
  const pa = phoneDigits(a.phone ?? "");
  const pb = phoneDigits(b.phone ?? "");
  if (pa.length >= 7 && pa.slice(-9) === pb.slice(-9) && pb.length >= 7) return "same phone";
  if (sameName(a.name, b.name)) return "same / similar name";
  if (a.company && b.company && normalizeName(a.company).length >= 5 && sameName(a.company, b.company) && sameName(a.name, b.name)) return "same company";
  return null;
}

/** Raggruppa i record che sembrano lo stesso (union-find). Restituisce solo i gruppi con 2+ elementi. */
export function groupDuplicates<T extends Person>(items: T[]): { items: T[]; reasons: string[] }[] {
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const reasons = new Map<number, Set<string>>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const r = matchReason(items[i], items[j]);
      if (!r) continue;
      const ri = find(i);
      const rj = find(j);
      if (ri !== rj) parent[rj] = ri;
      const root = find(i);
      reasons.set(root, (reasons.get(root) ?? new Set()).add(r));
    }
  }
  const groups = new Map<number, T[]>();
  items.forEach((it, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), it]));
  const out: { items: T[]; reasons: string[] }[] = [];
  for (const [root, list] of groups) {
    if (list.length < 2) continue;
    const rs = new Set<string>();
    for (const [k, set] of reasons) if (find(k) === root) set.forEach((x) => rs.add(x));
    out.push({ items: list, reasons: [...rs] });
  }
  return out;
}
