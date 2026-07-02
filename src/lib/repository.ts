import { leads, type Lead } from "@/data/sample";
import { dedupeCompanies, scoreCompany } from "@/domain/agro";
import { getSql } from "@/lib/db";
import { fetchEgrulLeadByInn, fetchEgrulRostovLeads } from "@/lib/egrul";
import type { OfficialLeadFact } from "@/lib/sources";

type DbLead = {
  id: string;
  name: string;
  short_name: string;
  inn: string;
  ogrn: string;
  district: string;
  locality: string;
  address: string;
  okved: string;
  lead_status: Lead["status"];
  revenue_rub: string | number;
  assets_rub: string | number;
  employees: number;
  corporate_email: string;
  phone: string;
  website: string;
  director: string;
  source: string;
  source_url: string;
  confidence: number;
  last_updated: string;
  has_crop_okved: boolean;
  has_machinery_signal: boolean;
  has_corporate_contact: boolean;
  risk_flags: number;
  agent_comment: string;
};

const globalLeads = globalThis as typeof globalThis & {
  __energogarantLeadMemory?: Map<string, Lead>;
};
const leadMemory = globalLeads.__energogarantLeadMemory ?? new Map<string, Lead>();
globalLeads.__energogarantLeadMemory = leadMemory;

function yandexDomainSources(lead: Pick<Lead, "inn" | "ogrn" | "shortName">) {
  const query = `${lead.inn} ${lead.ogrn} ${lead.shortName}`;
  const domains = [
    ["Checko", "checko.ru"],
    ["РБК Компании", "companies.rbc.ru"],
    ["СПАРК", "spark-interfax.ru"],
    ["BBNT", "bbnt.ru"],
    ["Audit-it", "audit-it.ru"],
    ["VBankCenter", "vbankcenter.ru"],
    ["Saby", "saby.ru"],
    ["Companium", "companium.ru"],
    ["Inndex", "inndex.ru"],
    ["Agrobase", "agrobase.ru"],
  ];
  return domains.map(([label, domain]) => ({
    label,
    url: `https://yandex.ru/search/?text=${encodeURIComponent(`site:${domain} ${query}`)}`,
  }));
}

export const knownLeadProfiles: Record<string, Partial<Lead>> = {
  // ponytail: public facts found manually; replace with persisted source_facts when DB is wired.
  "6122006924": {
    name: 'СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ (КОЛХОЗ) "КОЛОС"',
    shortName: 'СПК (КОЛХОЗ) "КОЛОС"',
    ogrn: "1026101312710",
    address: "346816, Ростовская область, Мясниковский район, с. Большие Салы, ул. Советская, д. 7",
    okved: "01.11.1 Выращивание зерновых культур; 01.11.3 Семена масличных культур; 01.41 Молочное КРС; 46.21.11 Оптовая торговля зерном",
    director: "ПРЕДСЕДАТЕЛЬ: Луспикаян Григорий Ардоваздович",
    phone: "(86349) 2-62-71",
    corporateEmail: "kolos12006@yandex.ru",
    revenueRub: 377_300_000,
    expensesRub: 326_814_000,
    assetsRub: 1_400_000_000,
    netProfitRub: 4_700_000,
    capitalRub: 1_400_000_000,
    fixedAssetsRub: 1_100_000_000,
    financialYear: "2025",
    financialSourceUrl: "https://companies.rbc.ru/id/1026101312710-spk-spk-kolhoz-kolos/",
    source: "Яндекс top-10: 10 открытых карточек контрагента",
    sourceUrl: "https://yandex.ru/search/?text=6122006924%20%D0%A1%D0%9F%D0%9A%20%D0%9A%D0%9E%D0%9B%D0%9E%D0%A1",
    activities: [
      "01.11.1 Выращивание зерновых культур",
      "01.11.3 Выращивание семян масличных культур",
      "01.41 Разведение молочного крупного рогатого скота",
      "46.21.11 Торговля оптовая зерном",
      "49.42 Услуги перевозок",
    ],
    publicSources: [
      { label: "Checko", url: "https://checko.ru/company/spk-kolhoz-kolos-1026101312710" },
      { label: "РБК Компании", url: "https://companies.rbc.ru/id/1026101312710-spk-spk-kolhoz-kolos/" },
      {
        label: "СПАРК",
        url: "https://spark-interfax.ru/rostovskaya-oblast-myasnikovski-raion/koop-kolos-inn-6122006924-ogrn-1026101312710-0a406d302c214c7da0475b4782576982",
      },
      { label: "BBNT", url: "https://bbnt.ru/company-requisites/253920" },
      { label: "Audit-it", url: "https://www.audit-it.ru/contragent/1026101312710_spk-kolkhoz-kolos" },
      { label: "VBankCenter", url: "https://vbankcenter.ru/contragent/1026101312710" },
      { label: "Saby", url: "https://saby.ru/profile/6122006924-612201001" },
      { label: "Companium", url: "https://companium.ru/id/1026101312710-spk-kolhoz-kolos" },
      { label: "Inndex", url: "https://inndex.ru/ul/bolshie-saly/ogrn-1026101312710-dbc-spk-kolhoz-kolos" },
      { label: "Agrobase", url: "https://www.agrobase.ru/organizations/apk/organization_apk_9267" },
    ],
    hasCropOkved: true,
    hasMachinerySignal: true,
    hasCorporateContact: true,
    confidence: 95,
    agentComment: "Факты собраны из 10 сайтов из выдачи Яндекса; перед коммерческим контактом нужна ручная проверка актуальности.",
  },
  "6119001066": {
    shortName: 'СПК-КОЛХОЗ "МАЯК"',
    ogrn: "1026101233949",
    address: "346976, Ростовская область, Матвеево-Курганский район, с. Каменно-Андрианово, ул. Центральная, д. 48/1",
    okved: "Выращивание зерновых культур; всего 13 видов деятельности",
    director: "ПРЕДСЕДАТЕЛЬ: Кулиш Сергей Николаевич",
    phone: "3-34-23; +7 (863) 412-33-48; +7 (863) 413-34-23",
    corporateEmail: "mayak888@mail.ru",
    revenueRub: 240_000_000,
    assetsRub: 336_000_000,
    netProfitRub: -24_700_000,
    financialYear: "2025",
    financialSourceUrl: "https://www.audit-it.ru/contragent/1026101233949_spk-kolkhoz-mayak",
    activities: ["Выращивание зерновых культур", "Всего 13 видов деятельности"],
    source: "Яндекс top-10: List-Org, Checko, Audit-it, Spark, T-Банк",
    sourceUrl: "https://yandex.ru/search/?text=6119001066%20%D0%A1%D0%9F%D0%9A%20%D0%9C%D0%90%D0%AF%D0%9A",
    hasCropOkved: true,
    hasMachinerySignal: true,
    hasCorporateContact: true,
    confidence: 90,
    agentComment: "Контакты найдены в List-Org; адрес/ОКВЭД сверены по Spark/T-Банк; финансы требуют ручной проверки перед предложением.",
  },
  "6102014170": {
    shortName: 'СПК "КОЛХОЗ ДОНСКОЙ"',
    ogrn: "1026100663885",
    address: "346706, Ростовская область, Аксайский район, хутор Черюмкин",
    okved: "Выращивание зерновых культур; всего 5 видов деятельности",
    director: "ПРЕДСЕДАТЕЛЬ: Кротов Андрей Викторович",
    phone: "+7 863 502-88-46",
    revenueRub: 65_100_000,
    assetsRub: 120_700_000,
    netProfitRub: 5_300_000,
    financialYear: "2024",
    financialSourceUrl: "https://checko.ru/company/spk-kolhoz-donskoy-1026100663885",
    activities: ["Выращивание зерновых культур", "Всего 5 видов деятельности"],
    source: "Яндекс top-10: РБК, Spark, Checko, Companium, Saby, T-Банк",
    sourceUrl: "https://yandex.ru/search/?text=6102014170%20%D0%A1%D0%9F%D0%9A%20%D0%94%D0%9E%D0%9D%D0%A1%D0%9A%D0%9E%D0%99",
    hasCropOkved: true,
    hasMachinerySignal: true,
    hasCorporateContact: true,
    confidence: 90,
    agentComment: "Контакт найден в Companium; адрес/ОКВЭД сверены по РБК/Spark/T-Банк; финансы из Checko.",
  },
};

function enrichKnownLeadProfile(lead: Lead): Lead {
  const profile = knownLeadProfiles[lead.inn];
  const enriched = profile ? { ...lead, ...profile } : lead;
  return {
    ...enriched,
    publicSources: enriched.publicSources?.length ? enriched.publicSources : yandexDomainSources(enriched),
  };
}

function scoreLead(lead: Lead) {
  const enriched = enrichKnownLeadProfile(lead);
  return {
    ...enriched,
    score: scoreCompany(enriched),
  };
}

function remember<T extends Lead>(items: T[]) {
  for (const item of items) leadMemory.set(item.inn, item);
  return items;
}

export function fallbackLeadFromInn(inn: string): Lead {
  return {
    id: `fallback-${inn}`,
    name: `Компания с ИНН ${inn}`,
    shortName: `ИНН ${inn}`,
    inn,
    ogrn: "",
    district: "Ростовская область",
    locality: "",
    address: "Не найдена в текущей открытой выдаче",
    okved: "требует проверки",
    status: "check",
    revenueRub: 0,
    assetsRub: 0,
    employees: 0,
    corporateEmail: "",
    phone: "",
    website: "",
    director: "Руководитель требует проверки",
    source: "ИНН из ссылки; ЕГРЮЛ не отдал запись в текущем запросе",
    sourceUrl: "https://egrul.nalog.ru/",
    confidence: 20,
    lastUpdated: "2026-07-02",
    hasCropOkved: false,
    hasMachinerySignal: false,
    hasCorporateContact: false,
    riskFlags: 2,
    agentComment: "Открытый источник временно не вернул карточку. Нужна повторная проверка ЕГРЮЛ или ручное подтверждение.",
  };
}

function mapDbLead(row: DbLead): Lead {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    inn: row.inn,
    ogrn: row.ogrn,
    district: row.district,
    locality: row.locality,
    address: row.address,
    okved: row.okved,
    status: row.lead_status,
    revenueRub: Number(row.revenue_rub),
    assetsRub: Number(row.assets_rub),
    employees: row.employees,
    corporateEmail: row.corporate_email,
    phone: row.phone,
    website: row.website,
    director: row.director,
    source: row.source,
    sourceUrl: row.source_url,
    confidence: row.confidence,
    lastUpdated: row.last_updated,
    hasCropOkved: row.has_crop_okved,
    hasMachinerySignal: row.has_machinery_signal,
    hasCorporateContact: row.has_corporate_contact,
    riskFlags: row.risk_flags,
    agentComment: row.agent_comment,
  };
}

export async function getLeads() {
  const sql = getSql();
  if (!sql) {
    // ponytail: merge seed so volatile EGRUL search cannot break direct lead URLs.
    const known = Object.keys(knownLeadProfiles).map(fallbackLeadFromInn);
    return remember(dedupeCompanies([...known, ...(await fetchEgrulRostovLeads()), ...leads])).map(scoreLead);
  }

  const rows = await sql`
    select *
    from companies
    order by updated_at desc, name asc
    limit 10000
  `;

  return remember((rows as DbLead[]).map(mapDbLead)).map(scoreLead);
}

export async function getLeadByInn(inn: string) {
  const cleanInn = inn.replace(/\D/g, "");
  const seed = leads.find((lead) => lead.inn === cleanInn);
  if (seed) return scoreLead(seed);

  const cached = leadMemory.get(cleanInn);
  if (cached) return scoreLead(cached);

  const fromList = (await getLeads()).find((lead) => lead.inn === cleanInn);
  if (fromList) return fromList;

  const fromEgrul = await fetchEgrulLeadByInn(cleanInn);
  if (!fromEgrul) return scoreLead(fallbackLeadFromInn(cleanInn));
  remember([fromEgrul]);
  return scoreLead(fromEgrul);
}

export async function saveOfficialImportBatch(
  items: OfficialLeadFact[],
  errors: string[],
) {
  const sql = getSql();
  if (!sql) return { saved: 0, logged: false };

  const jobId = `job-${Date.now()}`;
  await sql`
    insert into import_jobs (id, source_type, cursor_value, status, error, imported_count)
    values (${jobId}, 'official-open-sources', '0', 'running', '', 0)
  `;

  let saved = 0;
  try {
    for (const item of items.slice(0, 100)) {
      const companyId = `company-${item.inn}`;

      await sql`
        insert into companies (
          id, name, short_name, inn, ogrn, district, locality, address, okved,
          source, source_url, confidence, has_crop_okved, has_corporate_contact
        )
        values (
          ${companyId}, ${item.name}, ${item.name}, ${item.inn}, ${item.ogrn ?? ''},
          'Ростовская область', '', '', 'АПК',
          ${item.sourceType}, ${item.sourceUrl}, ${item.confidence}, true, false
        )
        on conflict (inn) do update set
          name = excluded.name,
          source = excluded.source,
          source_url = excluded.source_url,
          confidence = greatest(companies.confidence, excluded.confidence),
          updated_at = now()
      `;
      await sql`
        insert into source_facts (
          id, company_id, fact_type, fact_value, source_type, source_url,
          verified_status, confidence_score
        )
        values (
          ${`${companyId}-${item.sourceType}`}, ${companyId}, 'official_import', ${item.name},
          ${item.sourceType}, ${item.sourceUrl}, 'unverified', ${item.confidence}
        )
        on conflict (id) do nothing
      `;
      saved += 1;
    }

    await sql`
      update import_jobs
      set status = 'done',
          cursor_value = ${String(saved)},
          imported_count = ${saved},
          error = ${errors.join('; ')},
          updated_at = now()
      where id = ${jobId}
    `;
    return { saved, logged: true };
  } catch (error) {
    await sql`
      update import_jobs
      set status = 'error',
          cursor_value = ${String(saved)},
          imported_count = ${saved},
          error = ${String(error)},
          updated_at = now()
      where id = ${jobId}
    `;
    throw error;
  }
}
