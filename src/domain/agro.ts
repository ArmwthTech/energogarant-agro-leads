export type CompanySeed = {
  id: string;
  inn?: string | null;
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

export function normalizeInn(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function dedupeCompanies<T extends CompanySeed>(companies: T[]) {
  const seen = new Set<string>();
  return companies.filter((company) => {
    const key = normalizeInn(company.inn) || company.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
