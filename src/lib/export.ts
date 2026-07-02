import ExcelJS from "exceljs";
import { buildExportColumns } from "@/domain/agro";
import { contactSourceUrls, contactValues, findLeadContacts, getCachedContactInfo } from "@/lib/contact-enrichment";
import { getLeads } from "@/lib/repository";

const headers: Record<string, string> = {
  priority: "Приоритет",
  company: "Компания",
  inn: "ИНН",
  district: "Район",
  address: "Адрес",
  director: "Руководитель",
  okved: "Виды деятельности",
  revenueRub: "Оборот",
  expensesRub: "Расходы/себестоимость",
  netProfitRub: "Чистая прибыль",
  assetsRub: "Активы",
  corporateEmail: "Email",
  phone: "Телефон",
  website: "Сайт",
  contactStatus: "Статус контакта",
  contactConfidence: "Доверие контакта",
  contactSource: "Источник контакта",
  potential: "Потенциал",
  status: "Статус лида",
  source: "Источник лида",
  publicSources: "10 сайтов из Яндекса",
  agentComment: "Комментарий",
};

export async function buildLeadWorkbook() {
  const columns = buildExportColumns({
    includePersonalContacts: true,
    personalContactsVerified: false,
  });
  const leads = await getLeads();
  const enrichedContacts = new Map(
    await Promise.all(
      leads
        .filter((lead) => lead.publicSources?.length)
        .map(async (lead) => [lead.inn, await findLeadContacts(lead)] as const),
    ),
  );
  const rows = leads.map((lead) => {
    const contact = enrichedContacts.get(lead.inn) ?? getCachedContactInfo(lead.inn);
    const emptyContact = { candidates: [], contactSourceUrl: "" };
    const contactInfo = contact ?? emptyContact;
    return {
      priority: lead.score.priorityScore,
      company: lead.name,
      inn: lead.inn,
      district: lead.district,
      address: lead.address,
      director: lead.director,
      okved: lead.activities?.join("; ") || lead.okved,
      revenueRub: lead.revenueRub || "",
      expensesRub: lead.expensesRub || "",
      netProfitRub: lead.netProfitRub || "",
      assetsRub: lead.assetsRub || "",
      corporateEmail: contactValues(contactInfo, "email", lead.corporateEmail).join("; "),
      phone: contactValues(contactInfo, "phone", lead.phone).join("; "),
      website: contactValues(contactInfo, "website", lead.website).join("; "),
      contactStatus: contact?.contactStatus || "",
      contactConfidence: contact?.contactConfidence || "",
      contactSource: contactSourceUrls(contactInfo).join("; "),
      potential: `${lead.score.budgetRangeRub[0]}-${lead.score.budgetRangeRub[1]}`,
      status: lead.status,
      source: lead.source,
      publicSources: lead.publicSources?.map((source) => `${source.label}: ${source.url}`).join("; ") ?? "",
      agentComment: lead.agentComment,
    };
  });
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Лиды");
  worksheet.columns = columns.map((key) => ({
    key,
    header: headers[key] ?? key,
    width: 22,
  }));
  worksheet.addRows(rows);
  worksheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + columns.length)}1`,
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}
