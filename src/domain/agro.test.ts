import assert from "node:assert/strict";
import {
  buildExportColumns,
  dedupeCompanies,
  mergeLeadFacts,
  normalizeInn,
  safeSourceUrl,
  scoreCompany,
  validateCronSecret,
} from "./agro";
import { parseOpenCompanyRows } from "@/lib/parser";

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
