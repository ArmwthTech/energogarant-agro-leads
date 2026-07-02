import Link from "next/link";
import { notFound } from "next/navigation";
import { findLeadContacts, mergeContactInfo } from "@/lib/contact-enrichment";
import { getLeads } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ inn: string }>;
}) {
  const { inn } = await params;
  const lead = (await getLeads()).find((item) => item.inn === inn.replace(/\D/g, ""));
  if (!lead) notFound();

  const enriched = mergeContactInfo(lead, await findLeadContacts(lead));

  return (
    <main className="min-h-screen bg-[#f6f7f9] p-5 text-[#1d1d1f]">
      <section className="mx-auto max-w-5xl rounded-md border border-[#d9dde5] bg-white">
        <header className="border-b border-[#d9dde5] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8102e]">
            ЭНЕРГОГАРАНТ
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{enriched.shortName}</h1>
          <p className="mt-1 text-sm text-[#667085]">{enriched.name}</p>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <section>
            <h2 className="mb-2 text-sm font-semibold">Реквизиты</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-[#667085]">ИНН</dt>
                <dd className="font-mono">{enriched.inn}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#667085]">ОГРН</dt>
                <dd className="font-mono">{enriched.ogrn}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#667085]">Руководитель</dt>
                <dd>{enriched.director}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Контакты</h2>
            <div className="rounded-md border border-[#d9dde5] p-3 text-sm">
              <div>{enriched.phone || "Телефон не найден"}</div>
              <div className="mt-1 text-[#667085]">{enriched.corporateEmail || "Email не найден"}</div>
              {enriched.website ? (
                <a
                  className="mt-2 block text-[#c8102e] hover:underline"
                  href={enriched.website}
                  rel="noreferrer"
                  target="_blank"
                >
                  {enriched.website}
                </a>
              ) : (
                <div className="mt-2 text-[#667085]">Официальный сайт не найден</div>
              )}
            </div>
          </section>
        </div>

        <footer className="border-t border-[#d9dde5] p-5 text-sm">
          <Link className="text-[#c8102e] hover:underline" href="/">
            Вернуться к таблице
          </Link>
        </footer>
      </section>
    </main>
  );
}
