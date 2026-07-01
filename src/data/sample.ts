import { scoreCompany } from "@/domain/agro";

export type LeadStatus =
  | "new"
  | "check"
  | "email_sent"
  | "called"
  | "interested"
  | "rejected"
  | "in_progress";

export type Lead = {
  id: string;
  name: string;
  shortName: string;
  inn: string;
  ogrn: string;
  district: string;
  locality: string;
  address: string;
  okved: string;
  status: LeadStatus;
  revenueRub: number;
  assetsRub: number;
  employees: number;
  corporateEmail: string;
  phone: string;
  website: string;
  director: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  lastUpdated: string;
  hasCropOkved: boolean;
  hasMachinerySignal: boolean;
  hasCorporateContact: boolean;
  riskFlags: number;
  agentComment: string;
};

export const statusLabels: Record<LeadStatus, string> = {
  new: "Новый",
  check: "Проверить",
  email_sent: "Письмо",
  called: "Дозвон",
  interested: "Интерес",
  rejected: "Отказ",
  in_progress: "В работе",
};

export const leads: Lead[] = [
  {
    id: "lead-1",
    name: "СПК Колхоз имени Кирова",
    shortName: "СПК им. Кирова",
    inn: "6123012450",
    ogrn: "1026101234567",
    district: "Зерноградский",
    locality: "Зерноград",
    address: "Ростовская обл., г. Зерноград, ул. Производственная, 12",
    okved: "01.11 Выращивание зерновых культур",
    status: "new",
    revenueRub: 286_000_000,
    assetsRub: 410_000_000,
    employees: 94,
    corporateEmail: "info@kirov-spk.ru",
    phone: "+7 (86359) 2-14-10",
    website: "https://kirov-spk.example",
    director: "Проверить по ЕГРЮЛ",
    source: "ЕГРЮЛ + сайт",
    sourceUrl: "https://egrul.nalog.ru/",
    confidence: 82,
    lastUpdated: "2026-07-01",
    hasCropOkved: true,
    hasMachinerySignal: true,
    hasCorporateContact: true,
    riskFlags: 0,
    agentComment: "Проверить парк техники перед звонком.",
  },
  {
    id: "lead-2",
    name: "ООО Агрофирма Донские поля",
    shortName: "Донские поля",
    inn: "6168123401",
    ogrn: "1156196000001",
    district: "Сальский",
    locality: "Сальск",
    address: "Ростовская обл., Сальский р-н, промзона 4",
    okved: "01.11, 01.61 Услуги в растениеводстве",
    status: "check",
    revenueRub: 148_000_000,
    assetsRub: 230_000_000,
    employees: 58,
    corporateEmail: "office@donfields.example",
    phone: "+7 (86372) 5-20-44",
    website: "https://donfields.example",
    director: "Нужна ручная проверка",
    source: "Сайт компании",
    sourceUrl: "https://donfields.example",
    confidence: 68,
    lastUpdated: "2026-07-01",
    hasCropOkved: true,
    hasMachinerySignal: false,
    hasCorporateContact: true,
    riskFlags: 1,
    agentComment: "Есть общий email, должностных лиц не выгружать.",
  },
  {
    id: "lead-3",
    name: "АО Элеватор Юг-Агро",
    shortName: "Юг-Агро",
    inn: "6154019876",
    ogrn: "1066154009876",
    district: "Азовский",
    locality: "Азов",
    address: "Ростовская обл., Азовский р-н, ст. Кагальницкая",
    okved: "52.10 Хранение и складирование",
    status: "in_progress",
    revenueRub: 392_000_000,
    assetsRub: 680_000_000,
    employees: 121,
    corporateEmail: "zakupki@yug-agro.example",
    phone: "+7 (86342) 6-18-80",
    website: "https://yug-agro.example",
    director: "Проверить по ЕГРЮЛ",
    source: "Закупки + ЕГРЮЛ",
    sourceUrl: "https://zakupki.gov.ru/",
    confidence: 76,
    lastUpdated: "2026-06-30",
    hasCropOkved: false,
    hasMachinerySignal: true,
    hasCorporateContact: true,
    riskFlags: 0,
    agentComment: "Фокус: имущество, техника, ответственность.",
  },
  {
    id: "lead-4",
    name: "КФХ Мельник А. В.",
    shortName: "КФХ Мельник",
    inn: "610501112233",
    ogrn: "320619600011223",
    district: "Кагальницкий",
    locality: "Кагальницкая",
    address: "Ростовская обл., Кагальницкий р-н",
    okved: "01.13 Выращивание овощей",
    status: "email_sent",
    revenueRub: 44_000_000,
    assetsRub: 62_000_000,
    employees: 18,
    corporateEmail: "ferma-melnik@example.ru",
    phone: "+7 (86345) 3-09-31",
    website: "",
    director: "Персональные данные скрыты до проверки",
    source: "Открытый каталог",
    sourceUrl: "https://example.ru",
    confidence: 54,
    lastUpdated: "2026-06-29",
    hasCropOkved: true,
    hasMachinerySignal: false,
    hasCorporateContact: true,
    riskFlags: 1,
    agentComment: "Малый чек, но сезонный интерес по урожаю.",
  },
];

export function getScoredLeads() {
  return leads.map((lead) => ({
    ...lead,
    score: scoreCompany(lead),
  }));
}
