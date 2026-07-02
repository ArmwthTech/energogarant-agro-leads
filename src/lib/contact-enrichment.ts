import type { Lead } from "@/data/sample";
import { safeSourceUrl } from "@/domain/agro";

export type ContactInfo = {
  phone: string;
  corporateEmail: string;
  website: string;
  contactSourceUrl: string;
};

const cache = new Map<string, ContactInfo>();
const blockedHosts = [
  "audit-it.ru",
  "checko.ru",
  "egrul.nalog.ru",
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

  const phones = Array.from(
    new Set(
      (text.match(/(?:\+7|8)[\s(.-]*\d{3,5}[\s).:-]*\d[\d\s().-]{5,}/g) ?? [])
        .map((phone) => phone.replace(/\s+/g, " ").trim())
        .filter((phone) => phone.replace(/\D/g, "").length >= 10),
    ),
  );

  return {
    phone: phones[0] ?? "",
    corporateEmail: emails[0] ?? "",
  };
}

function isCompanyWebsite(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return !blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}

function matchesLeadPage(text: string, lead: Lead) {
  const digits = text.replace(/\D/g, " ");
  return digits.includes(lead.inn) || digits.includes(lead.ogrn);
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
  };

  try {
    const urls = await searchUrls(lead);
    for (const url of urls.filter(isCompanyWebsite).slice(0, 4)) {
      try {
        const text = stripHtml(await fetchText(url));
        if (!matchesLeadPage(text, lead)) continue;
        result.website ||= new URL(url).origin;
        const contacts = extractContacts(text);
        result.phone ||= contacts.phone;
        result.corporateEmail ||= contacts.corporateEmail;
        result.contactSourceUrl ||= contacts.phone || contacts.corporateEmail ? url : "";
      } catch {}
    }

    if (result.website && isCompanyWebsite(result.website)) {
      for (const path of ["", "/contacts", "/kontakty", "/contact"]) {
        try {
          const text = stripHtml(await fetchText(`${result.website.replace(/\/$/, "")}${path}`));
          if (!matchesLeadPage(text, lead)) continue;
          const contacts = extractContacts(text);
          result.phone ||= contacts.phone;
          result.corporateEmail ||= contacts.corporateEmail;
          result.contactSourceUrl ||= contacts.phone || contacts.corporateEmail ? result.website : "";
        } catch {}
      }
    }
  } catch {}

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
