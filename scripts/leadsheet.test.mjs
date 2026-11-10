import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../convex/lib/csv.ts";
import { mapSheetRow } from "../convex/lib/leadSheet.ts";

test("csv: virgolette, virgole e a-capo dentro i campi, CRLF, BOM", () => {
  const rows = parseCsv('﻿a,b,c\r\n1,"x, y","riga1\nriga2"\r\n2,"dice ""ciao""",\r\n\r\n');
  assert.deepEqual(rows, [{ a: "1", b: "x, y", c: "riga1\nriga2" }, { a: "2", b: 'dice "ciao"', c: "" }]);
});
test("csv vuoto", () => assert.deepEqual(parseCsv(""), []));
test("riga del foglio -> lead", () => {
  const l = mapSheetRow({ "Company name": "Hostaria Il Buco", "Phone number": "+39057830230", "Street address": "Via della Pace 41A", City: "Chianciano Terme", "State/Region": "SI", "Postal code": "53042", Industry: "Restaurant / Pizzeria", "Google rating": "4.4", "Google reviews": "1673", "Esito chiamata": "Non interessato", Note: "6/11: parlato", "Contatto (nome)": "Monia", Tentativi: "1" }, "2026-11-06");
  assert.equal(l.leadName, "Monia");
  assert.equal(l.company, "Hostaria Il Buco");
  assert.equal(l.leadStatus, "Lost");
  assert.equal(l.lossReason, "Not Qualified");
  assert.equal(l.category, "Hospitality & Food");
  assert.equal(l.niche, "Restaurant");
  assert.match(l.notes, /Chianciano Terme/);
  assert.equal(l.lastTouchDate, "2026-11-06");
});
test("senza nome contatto usa l'azienda; stati e settori", () => {
  const f = (o) => mapSheetRow({ "Company name": "X", ...o }, "2026-11-06");
  assert.equal(f({ "Contatto (nome)": "(titolare: nome da chiedere)" }).leadName, "X");
  assert.equal(f({ "Esito chiamata": "Connesso" }).leadStatus, "Follow-Up Ongoing");
  assert.equal(f({ "Esito chiamata": "Da chiamare" }).leadStatus, "New");
  assert.deepEqual([f({ Industry: "Ferramenta" }).category, f({ Industry: "Officina / Gommista" }).niche, f({ Industry: "Forno / Panificio / Macelleria" }).niche, f({ Industry: "Bar / Caffetteria / Pasticceria" }).niche, f({ Industry: "Centro estetico" }).niche], ["Retail & E-commerce", "Auto repair / body shop", "Bakery / pastry", "Bar / cafe", "Aesthetic clinic / medspa"]);
  assert.equal(mapSheetRow({ "Company name": "" }, "d"), null);
});
