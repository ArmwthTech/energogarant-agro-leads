import type { Lead } from "@/data/sample";
import { safeSourceUrl } from "@/domain/agro";

export type ContactInfo = {
  phone: string;
  corporateEmail: string;
  website: string;
  contactSourceUrl: string;
  contactStatus: ContactStatus;
  contactConfidence: number;
  contactSourceType: ContactSourceType | "";
  candidates: ContactCandidate[];
};

export type ContactStatus = "found" | "needs_check" | "verified" | "bad" | "no_answer" | "";
export type ContactSourceType = "official_site" | "procurement" | "registry" | "map" | "directory" | "social" | "manual";
export type ContactCandidate = {
  value: string;
  kind: "phone" | "email" | "website";
  sourceType: ContactSourceType;
  sourceUrl: string;
  confidence: number;
  status: ContactStatus;
};

const cache = new Map<string, ContactInfo>();
const blockedHosts = [
  "agrobase.ru",
  "audit-it.ru",
  "bbnt.ru",
  "checko.ru",
  "companium.ru",
  "egrul.nalog.ru",
  "inndex.ru",
  "k-agent.ru",
  "list-org.com",
  "meatinfo.ru",
  "myasoinfo.ru",
  "rusprofile.ru",
  "sbis.ru",
  "spark-interfax.ru",
  "vbankcenter.ru",
  "xfirm.ru",
  "zachestnyibiznes.ru",
];

const publicContactHints: Record<string, ContactCandidate[]> = {
  // ponytail: manual source seed; move to DB table when agents start adding many verified contact sources.
  "6122006924": [
    {
      value: "(86349) 2-62-71",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://www.agrobase.ru/organizations/apk/organization_apk_9267",
      confidence: 70,
      status: "found",
    },
    {
      value: "(928) 123-32-85",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://www.agrobase.ru/organizations/apk/organization_apk_9267",
      confidence: 70,
      status: "found",
    },
    {
      value: "+7 863 493-62-51",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://companium.ru/id/1026101312710-spk-kolhoz-kolos",
      confidence: 70,
      status: "found",
    },
    {
      value: "+7 863 493-62-71",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://companium.ru/id/1026101312710-spk-kolhoz-kolos",
      confidence: 70,
      status: "found",
    },
    {
      value: "+7 863 493-62-51",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://checko.ru/company/spk-kolhoz-kolos-1026101312710",
      confidence: 70,
      status: "found",
    },
    {
      value: "+7 863 493-62-71",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://checko.ru/company/spk-kolhoz-kolos-1026101312710",
      confidence: 70,
      status: "found",
    },
    {
      value: "kolos12006@yandex.ru",
      kind: "email",
      sourceType: "directory",
      sourceUrl: "https://companium.ru/id/1026101312710-spk-kolhoz-kolos",
      confidence: 70,
      status: "found",
    },
    {
      value: "kolos12006@yandex.ru",
      kind: "email",
      sourceType: "directory",
      sourceUrl: "https://checko.ru/company/spk-kolhoz-kolos-1026101312710",
      confidence: 70,
      status: "found",
    },
  ],
  "6119001066": [
    {
      value: "3-34-23",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://www.list-org.com/company/37022",
      confidence: 70,
      status: "found",
    },
    {
      value: "+7 (863) 412-33-48",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://www.list-org.com/company/37022",
      confidence: 70,
      status: "found",
    },
    {
      value: "+7 (863) 413-34-23",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://www.list-org.com/company/37022",
      confidence: 70,
      status: "found",
    },
    {
      value: "mayak888@mail.ru",
      kind: "email",
      sourceType: "directory",
      sourceUrl: "https://www.list-org.com/company/37022",
      confidence: 70,
      status: "found",
    },
  ],
  "6102014170": [
    {
      value: "+7 863 502-88-46",
      kind: "phone",
      sourceType: "directory",
      sourceUrl: "https://companium.ru/id/1026100663885-spk-kolhoz-donskoy",
      confidence: 70,
      status: "found",
    },
  ],
};

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

export function extractContacts(text: string) {
  const emails = Array.from(
    new Set(text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []),
  ).filter((email) => !email.includes("example.") && !email.endsWith(".png"));

  const phoneMatches = [
    ...(text.match(/(?<![\d(])(?:\+7|8)[\s(.-]*\d{3,5}[\s).:-]*\d[\d\s().-]{5,}/g) ?? []),
    ...(text.match(/\(\d{3,5}\)\s*\d[\d\s-]{4,}/g) ?? []),
  ];
  const phones = Array.from(new Set(phoneMatches.map((phone) => phone.replace(/\s+/g, " ").trim()))).filter(
    (phone) => {
      const digits = phone.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 12 && phone.length <= 32 && !digits.startsWith("8800") && !digits.startsWith("800");
    },
  );

  return {
    phone: phones[0] ?? "",
    corporateEmail: emails[0] ?? "",
  };
}

function sourceType(url: string): ContactSourceType {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("2gis") || host.includes("yandex.")) return "map";
    if (host.includes("vk.") || host.includes("ok.ru")) return "social";
    if (host.includes("zakupki.gov.ru")) return "procurement";
    if (host.includes("nalog.ru")) return "registry";
    if (blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return "directory";
    return "official_site";
  } catch {
    return "directory";
  }
}

function matchesLeadPage(text: string, lead: Lead) {
  const digits = text.replace(/\D/g, " ");
  return digits.includes(lead.inn) || digits.includes(lead.ogrn);
}

export function buildContactCandidates(
  contacts: ReturnType<typeof extractContacts>,
  sourceUrl: string,
  matchedLead: boolean,
) {
  const type = sourceType(sourceUrl);
  const confidence = matchedLead ? (type === "directory" ? 70 : 90) : type === "official_site" ? 55 : 35;
  const status: ContactStatus = matchedLead ? "found" : "needs_check";
  const rows: ContactCandidate[] = [];
  if (contacts.phone) rows.push({ value: contacts.phone, kind: "phone", sourceType: type, sourceUrl, confidence, status });
  if (contacts.corporateEmail) {
    rows.push({ value: contacts.corporateEmail, kind: "email", sourceType: type, sourceUrl, confidence, status });
  }
  return rows;
}

function bestCandidate(candidates: ContactCandidate[], kind: ContactCandidate["kind"]) {
  return candidates
    .filter((candidate) => candidate.kind === kind)
    .sort((a, b) => b.confidence - a.confidence)[0];
}

export function contactValues(
  info: Pick<ContactInfo, "candidates">,
  kind: ContactCandidate["kind"],
  fallback = "",
) {
  const seen = new Set<string>();
  return [
    ...fallback.split(";"),
    ...info.candidates.filter((candidate) => candidate.kind === kind).map((candidate) => candidate.value),
  ]
    .map((value) => value.trim())
    .filter((value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const digits = trimmed.replace(/\D/g, "");
    const key = kind === "phone" && digits.length >= 7 ? digits : trimmed.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function contactSourceUrls(info: Pick<ContactInfo, "candidates" | "contactSourceUrl">) {
  return Array.from(
    new Set([info.contactSourceUrl, ...info.candidates.map((candidate) => candidate.sourceUrl)].filter(Boolean)),
  );
}

function dedupeCandidates(candidates: ContactCandidate[]) {
  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate) => {
      const key = `${candidate.kind}:${candidate.value.replace(/\D/g, "") || candidate.value.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function decodeDuckUrl(url: string) {
  const parsed = new URL(url.startsWith("//") ? `https:${url}` : url);
  return parsed.searchParams.get("uddg") ?? parsed.toString();
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 energogarant-agro-leads/0.1" },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.text();
}

async function searchUrls(lead: Lead) {
  const query = `${lead.shortName} ${lead.inn} телефон email официальный сайт`;
  const html = await fetchText(
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  );
  const urls = Array.from(
    html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"/g),
  )
    .map((match) => safeSourceUrl(decodeDuckUrl(match[1].replace(/&amp;/g, "&"))))
    .filter((url) => url !== "#");
  return Array.from(new Set(urls)).slice(0, 8);
}

export async function findLeadContacts(lead: Lead): Promise<ContactInfo> {
  const cached = cache.get(lead.inn);
  if (cached) return cached;

  const result: ContactInfo = {
    phone: "",
    corporateEmail: "",
    website: safeSourceUrl(lead.website) === "#" ? "" : lead.website,
    contactSourceUrl: "",
    contactStatus: "",
    contactConfidence: 0,
    contactSourceType: "",
    candidates: [],
  };

  result.candidates.push(...(publicContactHints[lead.inn] ?? []));

  const needsWebSearch =
    !result.candidates.some((candidate) => candidate.kind === "phone") ||
    !result.candidates.some((candidate) => candidate.kind === "email");

  if (needsWebSearch) {
    try {
      const urls = await searchUrls(lead);
      for (const url of urls.slice(0, 8)) {
        try {
          const text = stripHtml(await fetchText(url));
          const matchedLead = matchesLeadPage(text, lead);
          if (matchedLead && sourceType(url) === "official_site") result.website ||= new URL(url).origin;
          const contacts = extractContacts(text);
          result.candidates.push(...buildContactCandidates(contacts, url, matchedLead));
        } catch {}
      }

      if (result.website) {
        for (const path of ["", "/contacts", "/kontakty", "/contact"]) {
          try {
            const text = stripHtml(await fetchText(`${result.website.replace(/\/$/, "")}${path}`));
            const matchedLead = matchesLeadPage(text, lead);
            const contacts = extractContacts(text);
            result.candidates.push(
              ...buildContactCandidates(contacts, `${result.website.replace(/\/$/, "")}${path}`, matchedLead),
            );
          } catch {}
        }
      }
    } catch {}
  }

  result.candidates = dedupeCandidates(result.candidates);
  const phone = bestCandidate(result.candidates, "phone");
  const email = bestCandidate(result.candidates, "email");
  const best = phone ?? email;
  result.phone = phone?.value ?? "";
  result.corporateEmail = email?.value ?? "";
  result.contactSourceUrl = best?.sourceUrl ?? "";
  result.contactStatus = best?.status ?? "";
  result.contactConfidence = best?.confidence ?? 0;
  result.contactSourceType = best?.sourceType ?? "";

  cache.set(lead.inn, result);
  return result;
}

export function getCachedContactInfo(inn: string) {
  return cache.get(inn);
}

export function mergeContactInfo<T extends Lead>(lead: T, info: ContactInfo): T {
  return {
    ...lead,
    phone: info.phone || lead.phone,
    corporateEmail: info.corporateEmail || lead.corporateEmail,
    website: info.website || lead.website,
    hasCorporateContact: Boolean(info.phone || info.corporateEmail || lead.hasCorporateContact),
  };
}
