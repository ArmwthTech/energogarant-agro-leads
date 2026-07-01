import { getScoredLeads } from "@/data/sample";

export async function GET() {
  return Response.json({ leads: getScoredLeads() });
}
