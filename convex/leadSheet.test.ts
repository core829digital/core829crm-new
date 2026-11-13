import { describe, expect, it } from "vitest";
import { mapSheetRow } from "./lib/leadSheet";

describe("foglio lead: nicchie e campi aggiuntivi", () => {
  it.each([
    ["Parrucchiere", "Beauty salon / barber"],
    ["Barbiere", "Beauty salon / barber"],
    ["Centro estetico", "Aesthetic clinic / medspa"],
    ["Studio dentistico", "Dental clinic"],
    ["Studio legale", "Law firm"],
    ["Poliambulatorio", "Medical clinic"],
    ["Serramentista", "Windows & doors (serramenti)"],
    ["Impresa edile", "Construction company"],
    ["Ristrutturazioni", "Renovation / contractor"],
  ])("%s -> %s", (industry, niche) => {
    expect(mapSheetRow({ "Company name": "X", Industry: industry }, "2026-11-13")?.niche).toBe(niche);
  });

  it("legge Email, Source e Fonte (link)", () => {
    const l = mapSheetRow({ "Company name": "X", Email: "a@b.it", Source: "AddLance", "Fonte (link)": "https://x.it/p" }, "2026-11-13")!;
    expect(l.email).toBe("a@b.it");
    expect(l.source).toBe("AddLance");
    expect(l.notes).toContain("Fonte: https://x.it/p");
  });

  it("senza Source resta l'origine predefinita", () => {
    expect(mapSheetRow({ "Company name": "X" }, "2026-11-13")!.source).toBe("Google Maps (scheda non rivendicata)");
  });
});
