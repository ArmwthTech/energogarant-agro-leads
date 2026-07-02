import { buildLeadWorkbook } from "@/lib/export";
import { isClerkConfigured, requireUser } from "@/lib/auth";

export async function GET() {
  const userId = await requireUser();
  if (isClerkConfigured() && !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await buildLeadWorkbook();
  return new Response(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="energogarant-leads.xlsx"',
    },
  });
}
