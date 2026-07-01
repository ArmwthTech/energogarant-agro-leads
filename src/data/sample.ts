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

const egrulRows = [
  ["СПК КОЛХОЗ \"КРАСНЫЙ\"", "6102012863", "1026100665711", "Председатель: Фроленко Сергей Васильевич"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ-КОЛХОЗ \"МАЯК\"", "6119001066", "1026101233949", "Председатель: Кулиш Сергей Николаевич"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ \"КОЛХОЗ ДОНСКОЙ\"", "6102014170", "1026100663885", "Председатель: Кротов Андрей Викторович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ КОЛХОЗ \"РАССВЕТ\"", "6114001030", "1026101086164", "Руководитель указан в ЕГРЮЛ"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ - КОЛХОЗ \"ЛИМАННЫЙ\"", "6123002908", "1026101346028", "Председатель: Беликов Евгений Владимирович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ КОЛХОЗ \"ПРИАЗОВЬЕ\"", "6123006148", "1026101343730", "Председатель: Прокопенко Николай Александрович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ (КОЛХОЗ) \"КОЛОС\"", "6119002743", "1026101233564", "Председатель: Скрытченко Василий Викторович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ \"КОЛХОЗ КРАСНОКУТСКИЙ\"", "6104000775", "1026100746275", "Председатель: Миллеров Владимир Александрович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ \"КОЛХОЗ ПОПОВСКИЙ\"", "6104000800", "1026100746297", "Председатель: Миллер Василий Александрович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ КОЛХОЗ \"БЕРЕЗОВЫЙ\"", "6114000580", "1026101083084", "Председатель: Бесчетнов Евгений Александрович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ КОЛХОЗ \"РОДИНА\"", "6119000721", "1026101233620", "Председатель: Джавлах Сергей Валентинович"],
  ["СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ  \"КОЛХОЗ \"ЗЕРНОВОЙ\"", "6102012486", "1026100661905", "Председатель: Юсупов Руслан Абдулвагабович"],
] as const;

export const leads: Lead[] = egrulRows.map(([name, inn, ogrn, director], index) => ({
  id: `egrul-${inn}`,
  name,
  shortName: name.replace("СЕЛЬСКОХОЗЯЙСТВЕННЫЙ ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ", "СПК"),
  inn,
  ogrn,
  district: "Ростовская область",
  locality: "",
  address: "Адрес уточняется в выписке ЕГРЮЛ",
  okved: "АПК, СПК/колхоз; ОКВЭД уточнить по выписке ЕГРЮЛ",
  status: index < 4 ? "new" : "check",
  revenueRub: 0,
  assetsRub: 0,
  employees: 0,
  corporateEmail: "",
  phone: "",
  website: "",
  director,
  source: "ЕГРЮЛ ФНС",
  sourceUrl: "https://egrul.nalog.ru/",
  confidence: 90,
  lastUpdated: "2026-07-01",
  hasCropOkved: true,
  hasMachinerySignal: false,
  hasCorporateContact: false,
  riskFlags: 1,
  agentComment: "Реквизиты из открытой выдачи ЕГРЮЛ ФНС; контакты и страховой интерес требуют ручной проверки.",
}));

export function getScoredLeads() {
  return leads.map((lead) => ({
    ...lead,
    score: scoreCompany(lead),
  }));
}
