import { leads, type Lead } from "@/data/sample";
import { scoreCompany } from "@/domain/agro";
import { getSql } from "@/lib/db";
import type { OfficialLeadFact } from "@/lib/sources";

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

export async function saveOfficialImportBatch(
  items: OfficialLeadFact[],
  errors: string[],
) {
  const sql = getSql();
  if (!sql) return { saved: 0, logged: false };

  const jobId = `job-${Date.now()}`;
  await sql`
    insert into import_jobs (id, source_type, cursor_value, status, error, imported_count)
    values (${jobId}, 'official-open-sources', '0', 'running', '', 0)
  `;

  let saved = 0;
  try {
    for (const item of items.slice(0, 100)) {
      const companyId = `company-${item.inn}`;

      await sql`
        insert into companies (
          id, name, short_name, inn, ogrn, district, locality, address, okved,
          source, source_url, confidence, has_crop_okved, has_corporate_contact
        )
        values (
          ${companyId}, ${item.name}, ${item.name}, ${item.inn}, ${item.ogrn ?? ''},
          'Ростовская область', '', '', 'АПК',
          ${item.sourceType}, ${item.sourceUrl}, ${item.confidence}, true, false
        )
        on conflict (inn) do update set
          name = excluded.name,
          source = excluded.source,
          source_url = excluded.source_url,
          confidence = greatest(companies.confidence, excluded.confidence),
          updated_at = now()
      `;
      await sql`
        insert into source_facts (
          id, company_id, fact_type, fact_value, source_type, source_url,
          verified_status, confidence_score
        )
        values (
          ${`${companyId}-${item.sourceType}`}, ${companyId}, 'official_import', ${item.name},
          ${item.sourceType}, ${item.sourceUrl}, 'unverified', ${item.confidence}
        )
        on conflict (id) do nothing
      `;
      saved += 1;
    }

    await sql`
      update import_jobs
      set status = 'done',
          cursor_value = ${String(saved)},
          imported_count = ${saved},
          error = ${errors.join('; ')},
          updated_at = now()
      where id = ${jobId}
    `;
    return { saved, logged: true };
  } catch (error) {
    await sql`
      update import_jobs
      set status = 'error',
          cursor_value = ${String(saved)},
          imported_count = ${saved},
          error = ${String(error)},
          updated_at = now()
      where id = ${jobId}
    `;
    throw error;
  }
}
