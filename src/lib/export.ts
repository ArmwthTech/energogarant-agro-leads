import ExcelJS from "exceljs";
import { buildExportColumns } from "@/domain/agro";
import { getLeads } from "@/lib/repository";

export async function buildLeadWorkbook() {
  const columns = buildExportColumns({
    includePersonalContacts: true,
    personalContactsVerified: false,
  });
  const rows = (await getLeads()).map((lead) => ({
    priority: lead.score.priorityScore,
    company: lead.name,
    inn: lead.inn,
    district: lead.district,
    corporateEmail: lead.corporateEmail,
    phone: lead.phone,
    potential: `${lead.score.budgetRangeRub[0]}-${lead.score.budgetRangeRub[1]}`,
    status: lead.status,
    source: lead.source,
    agentComment: lead.agentComment,
  }));
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
