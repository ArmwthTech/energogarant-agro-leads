import { leads, type Lead } from "@/data/sample";
import { scoreCompany } from "@/domain/agro";
import { getSql } from "@/lib/db";

type DbLead = {
  id: string;
  name: string;
  short_name: string;
  inn: string;
  ogrn: string;
  district: string;
  locality: string;
  address: string;
  okved: string;
  lead_status: Lead["status"];
  revenue_rub: string | number;
  assets_rub: string | number;
  employees: number;
  corporate_email: string;
  phone: string;
  website: string;
  director: string;
  source: string;
  source_url: string;
  confidence: number;
  last_updated: string;
  has_crop_okved: boolean;
  has_machinery_signal: boolean;
  has_corporate_contact: boolean;
  risk_flags: number;
  agent_comment: string;
};

function mapDbLead(row: DbLead): Lead {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    inn: row.inn,
    ogrn: row.ogrn,
    district: row.district,
    locality: row.locality,
    address: row.address,
    okved: row.okved,
    status: row.lead_status,
    revenueRub: Number(row.revenue_rub),
    assetsRub: Number(row.assets_rub),
    employees: row.employees,
    corporateEmail: row.corporate_email,
    phone: row.phone,
    website: row.website,
    director: row.director,
    source: row.source,
    sourceUrl: row.source_url,
    confidence: row.confidence,
    lastUpdated: row.last_updated,
    hasCropOkved: row.has_crop_okved,
    hasMachinerySignal: row.has_machinery_signal,
    hasCorporateContact: row.has_corporate_contact,
    riskFlags: row.risk_flags,
    agentComment: row.agent_comment,
  };
}

export async function getLeads() {
  const sql = getSql();
  if (!sql) {
    // ponytail: seed fallback keeps preview deploys working until Neon env is connected.
    return leads.map((lead) => ({ ...lead, score: scoreCompany(lead) }));
  }

  const rows = await sql`
    select *
    from companies
    order by updated_at desc, name asc
    limit 10000
  `;

  return (rows as DbLead[]).map(mapDbLead).map((lead) => ({
    ...lead,
    score: scoreCompany(lead),
  }));
}
