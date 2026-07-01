import { getLeads } from "@/lib/repository";

export async function GET() {
  return Response.json({ leads: await getLeads() });
}
