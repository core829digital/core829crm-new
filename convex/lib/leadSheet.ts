/**
 * Trasforma una riga del foglio dei lead (es. «CORE829-Lead-Valdichiana», scheda «Lead») in un lead del CRM.
 * Funzione pura, senza dipendenze: si puo' provare da sola.
 */

export type SheetLead = {
  leadName: string; company: string; email: string; phone: string; source: string; leadStatus: string; lossReason?: string;
  dateCreated: string; website?: string; notes?: string; category?: string; niche?: string; lastTouchDate?: string;
};

/** Settore del foglio -> categoria/nicchia del CRM (cataloghi in catalog.ts). */
const INDUSTRY: [RegExp, string, string][] = [
  [/ristorante|pizzeria|osteria|trattoria|restaurant/i, "Hospitality & Food", "Restaurant"],
  [/bar\b|caffett|pasticc|gelater/i, "Hospitality & Food", "Bar / cafe"],
  [/forno|panific/i, "Hospitality & Food", "Bakery / pastry"],
  [/macelleri/i, "Hospitality & Food", "Butcher / deli"],
  [/ferramenta/i, "Retail & E-commerce", "Hardware store"],
  [/officina|gommist|autofficina/i, "Automotive & Transport", "Auto repair / body shop"],
  [/parrucchier|barbier/i, "Health & Wellness", "Beauty salon / barber"],
  [/estetic/i, "Health & Wellness", "Aesthetic clinic / medspa"],
];

const STATUS: Record<string, { leadStatus: string; lossReason?: string }> = {
  "da chiamare": { leadStatus: "New" },
  "non risponde": { leadStatus: "New" },
  connesso: { leadStatus: "Follow-Up Ongoing" },
  interessato: { leadStatus: "Follow-Up Ongoing" },
  "zoom fissato": { leadStatus: "Meeting Follow-Up" },
  vinto: { leadStatus: "Won" },
  "non interessato": { leadStatus: "Lost", lossReason: "Not Qualified" },
  "non chiamare piu": { leadStatus: "Lost", lossReason: "Not Qualified" },
};

const clean = (s: string | undefined) => (s ?? "").trim();

/** `isoDate`: giorno di creazione da assegnare (il foglio non ha una colonna data). */
export function mapSheetRow(row: Record<string, string>, isoDate: string): SheetLead | null {
  const company = clean(row["Company name"]);
  if (!company) return null;
  const contact = clean(row["Contatto (nome)"]);
  const named = contact && !contact.startsWith("(") ? contact : "";
  const industry = clean(row["Industry"]);
  const cat = INDUSTRY.find(([re]) => re.test(industry));
  const esito = clean(row["Esito chiamata"]).toLowerCase();
  const st = STATUS[esito] ?? { leadStatus: "New" };

  const address = [clean(row["Street address"]), clean(row["City"]), clean(row["State/Region"]), clean(row["Postal code"])].filter(Boolean).join(", ");
  const rating = clean(row["Google rating"]);
  const reviews = clean(row["Google reviews"]);
  const notes = [
    clean(row["Note"]),
    clean(row["Pitch angle"]) && `Aggancio: ${clean(row["Pitch angle"])}`,
    address && `Indirizzo: ${address}`,
    industry && `Settore: ${industry}`,
    (rating || reviews) && `Google: ${rating || "?"} (${reviews || "?"} recensioni)`,
    clean(row["Lead priority"]) && `Priorita': ${clean(row["Lead priority"])}`,
    esito && `Esito: ${clean(row["Esito chiamata"])}`,
    clean(row["Orario richiamo"]) && `Richiamo: ${clean(row["Orario richiamo"])}`,
    clean(row["Giorno piano"]) && `Giorno piano: ${clean(row["Giorno piano"])}`,
    clean(row["Tentativi"]) && `Tentativi: ${clean(row["Tentativi"])}`,
  ].filter(Boolean).join("\n");

  return {
    leadName: named || company,
    company,
    email: "",
    phone: clean(row["Phone number"]),
    source: "Google Maps (scheda non rivendicata)",
    leadStatus: st.leadStatus,
    lossReason: st.lossReason,
    dateCreated: isoDate,
    website: clean(row["Website URL"]) || undefined,
    notes: notes || undefined,
    category: cat?.[1],
    niche: cat?.[2],
    lastTouchDate: Number(clean(row["Tentativi"])) > 0 ? isoDate : undefined,
  };
}
