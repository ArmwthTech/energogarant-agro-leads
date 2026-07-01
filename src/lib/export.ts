import { utils, write } from "xlsx";
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
  const worksheet = utils.json_to_sheet(rows, { header: columns });
  worksheet["!autofilter"] = { ref: worksheet["!ref"] ?? "A1:J1" };
  worksheet["!cols"] = columns.map(() => ({ wch: 22 }));
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Лиды");
  return write(workbook, { type: "buffer", bookType: "xlsx" });
}
