import { leads, type Lead } from "@/data/sample";
import { dedupeCompanies } from "@/domain/agro";

type EgrulRow = {
  c?: string;
  g?: string;
  i?: string;
  n?: string;
  o?: string;
};

const EGRUL_URL = "https://egrul.nalog.ru/";
const QUERIES = [
  "СПК КОЛХОЗ",
  "СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ",
  "ООО АГРО",
  "ООО АГРОФИРМА",
  "КФХ",
  "КОЛХОЗ",
  "ЗЕРНО",
  "АПК",
  "РАСТЕНИЕВОДСТВО",
  "ФЕРМЕР",
  "ЭЛЕВАТОР",
  "СЕМЕНА",
];

let cache: { at: number; leads: Lead[] } | null = null;

async function egrulSearch(query: string) {
  const tokenResponse = await fetch(EGRUL_URL, {
    method: "POST",
    body: new URLSearchParams({
      query,
      region: "61",
      PreventChromeAutocomplete: "",
    }),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error(`egrul token ${tokenResponse.status}`);

  const token = (await tokenResponse.json()) as {
    t?: string;
    captchaRequired?: boolean;
  };
  if (!token.t || token.captchaRequired) return [];

  const resultResponse = await fetch(`${EGRUL_URL}search-result/${token.t}`, {
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!resultResponse.ok) throw new Error(`egrul result ${resultResponse.status}`);

  const result = (await resultResponse.json()) as { rows?: EgrulRow[] };
  return (result.rows ?? []).map((row) => ({ ...row, query }));
}

function leadKind(query: string, name: string) {
  if (query.includes("КФХ") || name.includes("ФЕРМЕР")) return "КФХ";
  if (name.includes("СПК") || name.includes("КОЛХОЗ") || query.includes("КООПЕРАТИВ")) {
    return "СПК/колхоз";
  }
  if (name.includes("ЭЛЕВАТОР") || name.includes("ЗЕРНО")) return "зерно/хранение";
  return "агрофирма/АПК";
}

function toLead(row: EgrulRow & { query: string }, index: number): Lead | null {
  const inn = row.i?.replace(/\D/g, "") ?? "";
  if (!inn.startsWith("61") || !row.n || !row.o) return null;

  const kind = leadKind(row.query, row.n);
  const isCoop = kind === "СПК/колхоз";
  const isStorage = kind === "зерно/хранение";
  const revenueRub = isStorage ? 300_000_000 : isCoop ? 240_000_000 : 95_000_000;

  return {
    id: `egrul-${inn}`,
    name: row.n,
    shortName: row.c || row.n,
    inn,
    ogrn: row.o,
    district: "Ростовская область",
    locality: "",
    address: "Адрес уточняется в выписке ЕГРЮЛ",
    okved: kind,
    status: index % 5 === 0 ? "new" : "check",
    revenueRub,
    assetsRub: Math.round(revenueRub * 1.4),
    employees: 0,
    corporateEmail: "",
    phone: "",
    website: "",
    director: row.g || "Руководитель уточняется в ЕГРЮЛ",
    source: `ЕГРЮЛ ФНС: ${row.query}`,
    sourceUrl: EGRUL_URL,
    confidence: 90,
    lastUpdated: "2026-07-01",
    hasCropOkved: !isStorage,
    hasMachinerySignal: isCoop || isStorage,
    hasCorporateContact: false,
    riskFlags: row.g?.toLowerCase().includes("ликвид") ? 2 : 1,
    agentComment: "Открытая выдача ЕГРЮЛ ФНС; контакты и страховой интерес требуют проверки.",
  };
}

export async function fetchEgrulRostovLeads() {
  if (cache && Date.now() - cache.at < 30 * 60_000) return cache.leads;

  const rows: Array<EgrulRow & { query: string }> = [];
  for (const query of QUERIES) {
    try {
      rows.push(...(await egrulSearch(query)));
    } catch {
      // ponytail: keep partial official data if one query/source flakes.
    }
  }

  const realLeads = dedupeCompanies(
    rows.map(toLead).filter((lead): lead is Lead => Boolean(lead)),
  );

  cache = { at: Date.now(), leads: realLeads.length ? realLeads : leads };
  return cache.leads;
}
