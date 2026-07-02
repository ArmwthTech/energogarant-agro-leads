import assert from "node:assert/strict";
import {
  buildExportColumns,
  dedupeCompanies,
  filterLeadRows,
  mergeLeadFacts,
  normalizeInn,
  safeSourceUrl,
  scoreCompany,
  validateCronSecret,
} from "./agro";
import { parseOpenCompanyRows } from "@/lib/parser";
import { buildContactCandidates, extractContacts } from "@/lib/contact-enrichment";
import { fallbackLeadFromInn } from "@/lib/repository";

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
assert.ok(columns.includes("website"));
assert.ok(columns.includes("contactStatus"));
assert.ok(columns.includes("contactConfidence"));
assert.ok(columns.includes("contactSource"));

const parsed = parseOpenCompanyRows([
  ["61-23-012450", " СПК Колхоз имени Кирова ", "https://egrul.nalog.ru/"],
  ["6123012450", "СПК Колхоз имени Кирова дубль", "https://egrul.nalog.ru/"],
  ["", "Без ИНН", "https://example.ru"],
]);

assert.deepEqual(parsed, [
  {
    id: "parsed-1",
    inn: "6123012450",
    name: "СПК Колхоз имени Кирова",
    sourceUrl: "https://egrul.nalog.ru/",
  },
]);

assert.equal(safeSourceUrl("javascript:alert(1)"), "#");
assert.equal(safeSourceUrl("https://egrul.nalog.ru/"), "https://egrul.nalog.ru/");

assert.deepEqual(
  mergeLeadFacts([
    {
      id: "a",
      inn: "",
      ogrn: "1026100000001",
      name: "ООО Дон",
      sourceUrl: "https://egrul.nalog.ru/",
    },
    {
      id: "b",
      inn: "",
      ogrn: "1026100000001",
      name: "ООО Дон дубль",
      sourceUrl: "https://zakupki.gov.ru/",
    },
  ]).map((company) => company.id),
  ["a"],
);

assert.equal(validateCronSecret(undefined, undefined).status, 500);
assert.equal(validateCronSecret("secret", undefined).status, 401);
assert.equal(validateCronSecret("secret", "Bearer secret").status, 200);

assert.deepEqual(
  extractContacts("Телефон +7 (863) 123-45-67, email office@agro-don.ru"),
  { phone: "+7 (863) 123-45-67", corporateEmail: "office@agro-don.ru" },
);

assert.deepEqual(
  buildContactCandidates(
    { phone: "+7 (863) 123-45-67", corporateEmail: "" },
    "https://list-org.com/company",
    false,
  ),
  [
    {
      value: "+7 (863) 123-45-67",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://list-org.com/company",
      confidence: 35,
      status: "needs_check",
    },
  ],
);

assert.deepEqual(
  buildContactCandidates(
    { phone: "+7 (863) 123-45-67", corporateEmail: "office@agro-don.ru" },
    "https://agro-don.ru/contacts",
    true,
  ).map((candidate) => [candidate.kind, candidate.confidence, candidate.status]),
  [
    ["phone", 90, "found"],
    ["email", 90, "found"],
  ],
);

const filtered = filterLeadRows(
  [
    {
      name: "СПК Колхоз Дон",
      shortName: "Колхоз Дон",
      inn: "6102012863",
      ogrn: "1026100665711",
      district: "Ростовская область",
      okved: "СПК/колхоз",
      status: "new",
      source: "ЕГРЮЛ",
      director: "Председатель",
      score: { priorityScore: 80 },
    },
    {
      name: "КФХ Волна",
      shortName: "КФХ Волна",
      inn: "6102004693",
      ogrn: "1136181003133",
      district: "Ростовская область",
      okved: "КФХ",
      status: "check",
      source: "ЕГРЮЛ",
      director: "Глава",
      score: { priorityScore: 40 },
    },
  ],
  { search: "610201", kind: "СПК/колхоз", status: "new", sort: "priority_desc" },
);

assert.deepEqual(filtered.map((lead) => lead.inn), ["6102012863"]);

assert.equal(fallbackLeadFromInn("6135005822").inn, "6135005822");
assert.equal(fallbackLeadFromInn("6135005822").confidence, 20);
