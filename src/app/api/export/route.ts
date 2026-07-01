import { buildLeadWorkbook } from "@/lib/export";

export async function GET() {
  const body = await buildLeadWorkbook();
  return new Response(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="energogarant-leads.xlsx"',
    },
  });
}
