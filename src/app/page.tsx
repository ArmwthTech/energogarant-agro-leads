import { LeadsDashboard } from "@/app/leads-dashboard";
import { getScoredLeads } from "@/data/sample";

export default async function Home() {
  return <LeadsDashboard leads={getScoredLeads()} />;
}
