import assert from "node:assert/strict";
import {
  buildExportColumns,
  dedupeCompanies,
  normalizeInn,
  scoreCompany,
} from "./agro";

assert.equal(normalizeInn(" 61-60 123456 "), "6160123456");

const companies = [
  { id: "1", inn: "6160123456", name: "СПК Дон" },
  { id: "2", inn: "6160123456", name: "СПК Дон дубль" },
  { id: "3", inn: "", name: "Агрофирма Юг" },
  { id: "4", inn: "", name: "Агрофирма Юг" },
];

assert.deepEqual(
  dedupeCompanies(companies).map((company) => company.id),
  ["1", "3"],
);

const result = scoreCompany({
  revenueRub: 240_000_000,
  hasCropOkved: true,
  hasMachinerySignal: true,
  hasCorporateContact: true,
  riskFlags: 1,
});

assert.ok(result.priorityScore >= 70);
assert.ok(result.budgetRangeRub[0] > 0);
assert.ok(result.explanation.includes("растениеводство"));
assert.ok(result.explanation.includes("техника"));

const columns = buildExportColumns({
  includePersonalContacts: true,
  personalContactsVerified: false,
});

assert.ok(!columns.includes("personalPhone"));
assert.ok(columns.includes("corporateEmail"));
