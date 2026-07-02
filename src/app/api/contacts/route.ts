import { findLeadContacts } from "@/lib/contact-enrichment";
import { getLeadByInn } from "@/lib/repository";

export async function GET(request: Request) {
  const inn = new URL(request.url).searchParams.get("inn")?.replace(/\D/g, "");
  if (!inn) return Response.json({ error: "inn required" }, { status: 400 });

  const lead = await getLeadByInn(inn);
  if (!lead) return Response.json({ error: "not found" }, { status: 404 });

  return Response.json(await findLeadContacts(lead));
}
