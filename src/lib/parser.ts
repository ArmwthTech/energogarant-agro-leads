import { dedupeCompanies, normalizeInn } from "@/domain/agro";

export type ParsedCompany = {
  id: string;
  inn: string;
  name: string;
  sourceUrl: string;
};

export function parseOpenCompanyRows(rows: string[][]): ParsedCompany[] {
  return dedupeCompanies(
    rows
      .map((row, index) => ({
        id: `parsed-${index + 1}`,
        inn: normalizeInn(row[0]),
        name: (row[1] ?? "").trim(),
        sourceUrl: (row[2] ?? "").trim(),
      }))
      .filter((company) => company.inn && company.name),
  );
}
