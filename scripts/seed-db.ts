import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { contactSourceUrls, contactValues, findLeadContacts } from "@/lib/contact-enrichment";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Put Neon/Postgres URL into .env.local or environment.");
}

const sql = neon(databaseUrl);

function id(parts: Array<string | number | undefined>) {
  return Buffer.from(parts.filter(Boolean).join("|")).toString("base64url").slice(0, 48);
}

async function applySchema() {
  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  for (const statement of schema.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
}

async function main() {
  // ponytail: force repository fallback seed; DB may be empty before this script runs.
  delete process.env.DATABASE_URL;
  const { getLeads } = await import("@/lib/repository");
  process.env.DATABASE_URL = databaseUrl;

  await applySchema();
  const leads = await getLeads();
  let companies = 0;
  let contacts = 0;
  let facts = 0;

  for (const lead of leads) {
    const companyId = `company-${lead.inn}`;
    const contactInfo = lead.publicSources?.length
      ? await findLeadContacts(lead)
      : { candidates: [], contactSourceUrl: "" };
    const phones = contactValues(contactInfo, "phone", lead.phone);
    const emails = contactValues(contactInfo, "email", lead.corporateEmail);
    const websites = contactValues(contactInfo, "website", lead.website);

    await sql.query(
      `insert into companies (
        id, name, short_name, inn, ogrn, district, locality, address, okved,
        lead_status, revenue_rub, assets_rub, employees, corporate_email, phone, website,
        director, source, source_url, confidence, last_updated, has_crop_okved,
        has_machinery_signal, has_corporate_contact, risk_flags, agent_comment, updated_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,now()
      )
      on conflict (inn) do update set
        name = excluded.name,
        short_name = excluded.short_name,
        ogrn = excluded.ogrn,
        address = excluded.address,
        okved = excluded.okved,
        revenue_rub = excluded.revenue_rub,
        assets_rub = excluded.assets_rub,
        corporate_email = excluded.corporate_email,
        phone = excluded.phone,
        website = excluded.website,
        director = excluded.director,
        source = excluded.source,
        source_url = excluded.source_url,
        confidence = greatest(companies.confidence, excluded.confidence),
        has_crop_okved = excluded.has_crop_okved,
        has_machinery_signal = excluded.has_machinery_signal,
        has_corporate_contact = excluded.has_corporate_contact,
        risk_flags = excluded.risk_flags,
        agent_comment = excluded.agent_comment,
        updated_at = now()`,
      [
        companyId,
        lead.name,
        lead.shortName,
        lead.inn,
        lead.ogrn,
        lead.district,
        lead.locality,
        lead.address,
        lead.activities?.join("; ") || lead.okved,
        lead.status,
        lead.revenueRub,
        lead.assetsRub,
        lead.employees,
        emails.join("; "),
        phones.join("; "),
        websites.join("; "),
        lead.director,
        lead.source,
        lead.sourceUrl,
        lead.confidence,
        lead.lastUpdated,
        lead.hasCropOkved,
        lead.hasMachinerySignal,
        Boolean(phones.length || emails.length || lead.hasCorporateContact),
        lead.riskFlags,
        lead.agentComment,
      ],
    );
    companies += 1;

    for (const [type, values] of [["phone", phones], ["email", emails], ["website", websites]] as const) {
      for (const value of values) {
        await sql.query(
          `insert into contacts (id, company_id, contact_type, value, verified_status, source_url)
           values ($1,$2,$3,$4,'requires_check',$5)
           on conflict (id) do update set value = excluded.value, source_url = excluded.source_url, fetched_at = now()`,
          [`contact-${id([lead.inn, type, value])}`, companyId, type, value, contactSourceUrls(contactInfo).join("; ")],
        );
        contacts += 1;
      }
    }

    for (const source of lead.publicSources ?? [{ label: lead.source, url: lead.sourceUrl }]) {
      await sql.query(
        `insert into source_facts (id, company_id, fact_type, fact_value, source_type, source_url, confidence_score)
         values ($1,$2,'public_source',$3,'yandex_top_10',$4,$5)
         on conflict (id) do update set fact_value = excluded.fact_value, source_url = excluded.source_url, fetched_at = now()`,
        [`source-${id([lead.inn, source.label, source.url])}`, companyId, source.label, source.url, lead.confidence],
      );
      facts += 1;
    }
  }

  console.log(JSON.stringify({ ok: true, companies, contacts, facts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
