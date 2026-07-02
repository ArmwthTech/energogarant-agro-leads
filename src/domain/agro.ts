export type CompanySeed = {
  id: string;
  inn?: string | null;
  ogrn?: string | null;
  name: string;
};

export type ScoreInput = {
  revenueRub?: number | null;
  hasCropOkved: boolean;
  hasMachinerySignal: boolean;
  hasCorporateContact: boolean;
  riskFlags: number;
};

export type ScoreResult = {
  priorityScore: number;
  budgetRangeRub: [number, number];
  explanation: string;
};

export type LeadFilters = {
  search: string;
  kind: string;
  status: string;
  sort: "priority_desc" | "priority_asc";
};

export function normalizeInn(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function dedupeCompanies<T extends CompanySeed>(companies: T[]) {
  const seen = new Set<string>();
  return companies.filter((company) => {
    const key =
      normalizeInn(company.inn) ||
      normalizeInn(company.ogrn) ||
      normalizeName(company.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function mergeLeadFacts<T extends CompanySeed>(companies: T[]) {
  return dedupeCompanies(companies);
}

export function safeSourceUrl(value: string | null | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "#";
  } catch {
    return "#";
  }
}

export function validateCronSecret(
  secret: string | undefined,
  authorization: string | null | undefined,
) {
  if (!secret) return { status: 500, message: "CRON_SECRET is not configured" };
  if (authorization !== `Bearer ${secret}`) {
    return { status: 401, message: "Unauthorized" };
  }
  return { status: 200, message: "OK" };
}

export function scoreCompany(input: ScoreInput): ScoreResult {
  const revenue = Math.max(input.revenueRub ?? 0, 0);
  const scaleScore = revenue >= 200_000_000 ? 35 : revenue >= 50_000_000 ? 24 : 12;
  const cropScore = input.hasCropOkved ? 25 : 0;
  const machineryScore = input.hasMachinerySignal ? 20 : 0;
  const contactScore = input.hasCorporateContact ? 15 : 0;
  const penalty = Math.min(input.riskFlags * 7, 21);
  const priorityScore = Math.max(
    0,
    Math.min(100, scaleScore + cropScore + machineryScore + contactScore - penalty),
  );
  const base = Math.max(Math.round(revenue * 0.004), 120_000);
  const factors = [
    input.hasCropOkved && "растениеводство",
    input.hasMachinerySignal && "техника",
    input.hasCorporateContact && "есть корпоративный контакт",
  ].filter(Boolean);

  return {
    priorityScore,
    budgetRangeRub: [base, Math.round(base * 2.4)],
    explanation: factors.length
      ? `Потенциал: ${factors.join(", ")}.`
      : "Потенциал рассчитан по масштабу компании.",
  };
}

export function buildExportColumns(options: {
  includePersonalContacts: boolean;
  personalContactsVerified: boolean;
}) {
  const columns = [
    "priority",
    "company",
    "inn",
    "district",
    "corporateEmail",
    "phone",
    "website",
    "contactStatus",
    "contactConfidence",
    "contactSource",
    "potential",
    "status",
    "source",
    "agentComment",
  ];

  if (options.includePersonalContacts && options.personalContactsVerified) {
    columns.push("personalName", "personalPhone");
  }

  return columns;
}

export function filterLeadRows<
  T extends {
    name: string;
    shortName: string;
    inn: string;
    ogrn: string;
    district: string;
    okved: string;
    status: string;
    source: string;
    director: string;
    score: { priorityScore: number };
  },
>(rows: T[], filters: LeadFilters) {
  const search = filters.search.trim().toLowerCase();
  return rows
    .filter((row) => {
      const haystack = [
        row.name,
        row.shortName,
        row.inn,
        row.ogrn,
        row.district,
        row.okved,
        row.source,
        row.director,
      ]
        .join(" ")
        .toLowerCase();
      return !search || haystack.includes(search);
    })
    .filter((row) => filters.kind === "all" || row.okved === filters.kind)
    .filter((row) => filters.status === "all" || row.status === filters.status)
    .sort((a, b) =>
      filters.sort === "priority_desc"
        ? b.score.priorityScore - a.score.priorityScore
        : a.score.priorityScore - b.score.priorityScore,
    );
}
