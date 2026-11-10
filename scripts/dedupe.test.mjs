import test from "node:test";
import assert from "node:assert/strict";
import { editDistance, groupDuplicates, normalizeName, sameName } from "../convex/lib/dedupe.ts";

test("normalizza accenti e maiuscole", () => {
  assert.equal(normalizeName("  Émile  O'Brien "), "emile o brien");
});
test("distanza con scambio di lettere", () => {
  assert.equal(editDistance("ab", "ba"), 1);
  assert.equal(editDistance("bouterline", "boutourline"), 2);
});
test("riconosce lo stesso nome scritto male", () => {
  assert.ok(sameName("Dimitri Bouterline", "Dimitri Boutourline"));
  assert.ok(sameName("Rossi Mario", "Mario Rossi"));
  assert.ok(sameName("Mario  Rossi", "mario rossi"));
});
test("non confonde persone diverse", () => {
  assert.ok(!sameName("Mario Rossi", "Maria Rossi"));
  assert.ok(!sameName("Luca Bianchi", "Luca Bianco"));
  assert.ok(!sameName("Ugo Rossi", "Ugo Rosso"), "nomi corti: solo uguaglianza esatta");
});
test("raggruppa per email, telefono o nome", () => {
  const g = groupDuplicates([
    { id: "1", name: "Anna Verdi", email: "a@x.it" },
    { id: "2", name: "A. Verdi", email: "A@X.it" },
    { id: "3", name: "Paolo Neri", phone: "+39 333 1234567" },
    { id: "4", name: "Neri P", phone: "333-1234567" },
    { id: "5", name: "Giulia Gialli" },
  ]);
  assert.equal(g.length, 2);
  assert.deepEqual(g.map((x) => x.items.map((i) => i.id).sort()).sort(), [["1", "2"], ["3", "4"]]);
});
