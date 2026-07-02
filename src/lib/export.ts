import ExcelJS from "exceljs";
import { buildExportColumns } from "@/domain/agro";
import { getCachedContactInfo } from "@/lib/contact-enrichment";
import { getLeads } from "@/lib/repository";

export async function buildLeadWorkbook() {
  const columns = buildExportColumns({
    includePersonalContacts: true,
    personalContactsVerified: false,
  });
  const rows = (await getLeads()).map((lead) => {
    const contact = getCachedContactInfo(lead.inn);
    return {
      priority: lead.score.priorityScore,
      company: lead.name,
      inn: lead.inn,
      district: lead.district,
      corporateEmail: contact?.corporateEmail || lead.corporateEmail,
      phone: contact?.phone || lead.phone,
      website: contact?.website || lead.website,
      potential: `${lead.score.budgetRangeRub[0]}-${lead.score.budgetRangeRub[1]}`,
      status: lead.status,
      source: lead.source,
      agentComment: lead.agentComment,
    };
  });
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Лиды");
  worksheet.columns = columns.map((key) => ({
    key,
    header: key,
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
