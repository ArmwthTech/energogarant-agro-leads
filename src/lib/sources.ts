import { mergeLeadFacts, normalizeInn, safeSourceUrl } from "@/domain/agro";

export type OfficialLeadFact = {
  id: string;
  inn: string;
  ogrn?: string;
  name: string;
  sourceType: "rmsp" | "mcx" | "zakupki";
  sourceUrl: string;
  confidence: number;
};

const SOURCES = {
  rmsp: "https://rmsp.nalog.ru/statistics.html?fo=3&level=0&ssrf=61&statDate=",
  mcx: "https://mcx.donland.ru/activity/35217/",
  zakupki: "https://zakupki.gov.ru/epz/order/extendedsearch/search.html",
};

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "energogarant-agro-leads/0.1" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.text();
}

function textOnly(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
}

function extractInnNamedRows(
  html: string,
  sourceType: OfficialLeadFact["sourceType"],
  sourceUrl: string,
) {
  const text = textOnly(html).replace(/\s+/g, " ");
  const rows: OfficialLeadFact[] = [];
  const pattern =
    /((?:ООО|АО|ПАО|СПК|СХА|КФХ|ИП)\s+[^,;]{3,120}?)\s+(?:ИНН\s*)?(\d{10}|\d{12})/giu;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) && rows.length < 100) {
    rows.push({
      id: `${sourceType}-${normalizeInn(match[2])}`,
      inn: normalizeInn(match[2]),
      name: match[1].trim(),
      sourceType,
      sourceUrl: safeSourceUrl(sourceUrl),
      confidence: sourceType === "mcx" ? 85 : 70,
    });
  }
  return rows;
}

export async function fetchRmspRostov() {
  const html = await fetchText(SOURCES.rmsp);
  return extractInnNamedRows(html, "rmsp", SOURCES.rmsp);
}

export async function fetchMcxSubsidies() {
  const html = await fetchText(SOURCES.mcx);
  return extractInnNamedRows(html, "mcx", SOURCES.mcx);
}

export async function fetchZakupkiSignals() {
  const html = await fetchText(SOURCES.zakupki);
  return extractInnNamedRows(html, "zakupki", SOURCES.zakupki);
}

export async function runOfficialImportBatch() {
  const errors: string[] = [];
  const results = await Promise.allSettled([
    fetchRmspRostov(),
    fetchMcxSubsidies(),
    fetchZakupkiSignals(),
  ]);

  const items = results.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    return [];
  });

  return {
    items: mergeLeadFacts(items),
    errors,
  };
}
