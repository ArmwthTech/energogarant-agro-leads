import Link from "next/link";
import { ArrowLeft, ExternalLink, MousePointer2, Search } from "lucide-react";
import { findLeadContacts, mergeContactInfo } from "@/lib/contact-enrichment";
import { getLeadByInn } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ inn: string }>;
}) {
  const { inn } = await params;
  const cleanInn = inn.replace(/\D/g, "");
  const lead = await getLeadByInn(cleanInn);

  const contactInfo = await Promise.race([
    findLeadContacts(lead),
    new Promise<Awaited<ReturnType<typeof findLeadContacts>>>((resolve) =>
      setTimeout(
        () =>
          resolve({
            phone: "",
            corporateEmail: "",
            website: "",
            contactSourceUrl: "",
            contactStatus: "",
            contactConfidence: 0,
            contactSourceType: "",
            candidates: [],
          }),
        6000,
      ),
    ),
  ]);
  const enriched = mergeContactInfo(lead, contactInfo);
  const money = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1, notation: "compact" });
  const query = `${enriched.shortName} ${enriched.inn} Ростовская область`;
  const links = [
    ["Яндекс", `https://yandex.ru/search/?text=${encodeURIComponent(`${query} официальный сайт телефон email`)}`],
    ["Google", `https://www.google.com/search?q=${encodeURIComponent(`${query} официальный сайт контакты`)}`],
    ["VK", `https://vk.com/search?c%5Bq%5D=${encodeURIComponent(query)}&c%5Bsection%5D=communities`],
    ["OK", `https://ok.ru/search?st.query=${encodeURIComponent(query)}`],
    ["2ГИС", `https://2gis.ru/search/${encodeURIComponent(query)}`],
  ];

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
              <div>
                <dt className="text-xs text-[#667085]">Адрес</dt>
                <dd>{enriched.address || "Адрес не найден"}</dd>
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
              {contactInfo.contactStatus && (
                <div className="mt-3 text-xs text-[#667085]">
                  Статус: {contactInfo.contactStatus}, доверие: {contactInfo.contactConfidence}%, источник:{" "}
                  {contactInfo.contactSourceType}
                </div>
              )}
            </div>
          </section>

          <section className="md:col-span-2">
            <h2 className="mb-2 text-sm font-semibold">Бухгалтерская отчетность</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Год", enriched.financialYear || "не найдено"],
                ["Оборот", enriched.revenueRub ? `${money.format(enriched.revenueRub)} руб.` : "не найден"],
                ["Расходы", enriched.expensesRub ? `${money.format(enriched.expensesRub)} руб.` : "не найдены"],
                ["Прибыль", enriched.netProfitRub ? `${money.format(enriched.netProfitRub)} руб.` : "не найдена"],
                ["Активы", enriched.assetsRub ? `${money.format(enriched.assetsRub)} руб.` : "не найдены"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#d9dde5] p-3">
                  <div className="text-xs text-[#667085]">{label}</div>
                  <div className="mt-1 text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>
            {enriched.financialSourceUrl && (
              <a
                className="mt-3 inline-flex items-center gap-2 text-sm text-[#c8102e] hover:underline"
                href={enriched.financialSourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Источник отчетности <ExternalLink size={13} />
              </a>
            )}
          </section>

          <section className="md:col-span-2">
            <h2 className="mb-2 text-sm font-semibold">Виды деятельности</h2>
            <div className="rounded-md border border-[#d9dde5] p-3 text-sm">
              {enriched.activities?.length ? (
                <ul className="grid gap-2 md:grid-cols-2">
                  {enriched.activities.map((activity) => (
                    <li key={activity}>{activity}</li>
                  ))}
                </ul>
              ) : (
                enriched.okved || "ОКВЭД не найден"
              )}
            </div>
          </section>

          <section className="md:col-span-2">
            <h2 className="mb-2 text-sm font-semibold">Открытые источники проверки</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {(enriched.publicSources ?? [{ label: enriched.source, url: enriched.sourceUrl }]).map((source) => (
                <a
                  key={`${source.label}-${source.url}`}
                  className="inline-flex min-h-10 items-center justify-between gap-2 rounded-md border border-[#d9dde5] px-3 py-2 text-sm hover:border-[#c8102e] hover:text-[#c8102e]"
                  href={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{source.label}</span>
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </section>

          <section className="md:col-span-2">
            <h2 className="mb-2 text-sm font-semibold">Поиск сайта и соцсетей</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {links.map(([label, href]) => (
                <a
                  key={label}
                  className="inline-flex h-10 items-center justify-between rounded-md border border-[#d9dde5] px-3 text-sm hover:border-[#c8102e] hover:text-[#c8102e]"
                  href={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="inline-flex items-center gap-2">
                    <Search size={15} />
                    {label}
                  </span>
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-[#d9dde5] p-5 text-sm">
          <Link
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#c8102e] px-4 py-3 font-semibold text-white shadow-lg shadow-[#c8102e]/25 transition hover:-translate-y-0.5 hover:bg-[#9f0d24] focus:outline-none focus:ring-4 focus:ring-[#c8102e]/25"
            href="/"
          >
            <ArrowLeft size={16} />
            Вернуться к таблице
            <MousePointer2 className="animate-pulse" size={16} />
          </Link>
        </footer>
      </section>
    </main>
  );
}
