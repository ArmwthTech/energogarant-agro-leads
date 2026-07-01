import {
  AlertTriangle,
  ArrowDownUp,
  Building2,
  CalendarClock,
  Download,
  FileSearch,
  Gauge,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  TableProperties,
  Users,
} from "lucide-react";
import { statusLabels } from "@/data/sample";
import { getLeads } from "@/lib/repository";

const nav = [
  { label: "Лиды", icon: TableProperties, active: true },
  { label: "Импорт", icon: RefreshCw },
  { label: "Отчеты", icon: Gauge },
  { label: "Агенты", icon: Users },
  { label: "Настройки", icon: Settings },
];

function rub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default async function Home() {
  const leads = await getLeads();
  const selectedLead = leads[0];
  const stats = {
    total: leads.length,
    high: leads.filter((lead) => lead.score.priorityScore >= 70).length,
    contacts: leads.filter((lead) => lead.corporateEmail || lead.phone).length,
    check: leads.filter((lead) => lead.confidence < 70).length,
  };

  if (!selectedLead) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6">
        <section className="rounded-md border border-[#d9dde5] bg-white p-6">
          <h1 className="text-xl font-semibold">Лиды не загружены</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Запустите импорт или подключите Neon Postgres с таблицей companies.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#1d1d1f]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[76px_minmax(720px,1fr)_380px]">
        <aside className="hidden border-r border-[#d9dde5] bg-white lg:block">
          <div className="flex h-16 items-center justify-center border-b border-[#d9dde5]">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#c8102e] text-sm font-black text-white">
              Э
            </div>
          </div>
          <nav className="flex flex-col gap-2 p-3">
            {nav.map((item) => (
              <button
                key={item.label}
                className={`grid h-12 place-items-center rounded-md border text-[#667085] transition ${
                  item.active
                    ? "border-[#c8102e] bg-[#fff1f3] text-[#c8102e]"
                    : "border-transparent hover:border-[#d9dde5] hover:bg-[#f6f7f9]"
                }`}
                title={item.label}
              >
                <item.icon size={20} />
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex min-h-16 flex-col gap-3 border-b border-[#d9dde5] bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8102e]">
                ЭНЕРГОГАРАНТ
              </div>
              <h1 className="text-xl font-semibold">
                Лиды АПК Ростовская область
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/export"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c8102e] px-3 text-sm font-semibold text-white hover:bg-[#9f0d24]"
              >
                <Download size={16} />
                Экспорт XLSX
              </a>
            </div>
          </header>

          <div className="border-b border-[#d9dde5] bg-white px-5 py-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(220px,1fr)_160px_160px] xl:grid-cols-[minmax(220px,1fr)_160px_160px_160px_140px]">
              <label className="flex h-10 items-center gap-2 rounded-md border border-[#d9dde5] bg-white px-3 text-sm text-[#667085]">
                <Search size={16} />
                <input
                  className="min-w-0 flex-1 outline-none"
                  placeholder="Поиск по компании, ИНН, району"
                />
              </label>
              <select className="h-10 rounded-md border border-[#d9dde5] bg-white px-3 text-sm">
                <option>Все районы</option>
                <option>Зерноградский</option>
                <option>Сальский</option>
                <option>Азовский</option>
              </select>
              <select className="h-10 rounded-md border border-[#d9dde5] bg-white px-3 text-sm">
                <option>ОКВЭД АПК</option>
                <option>Растениеводство</option>
                <option>Хранение</option>
              </select>
              <select className="h-10 rounded-md border border-[#d9dde5] bg-white px-3 text-sm">
                <option>Все статусы</option>
                {Object.values(statusLabels).map((label) => (
                  <option key={label}>{label}</option>
                ))}
              </select>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d9dde5] bg-white text-sm font-medium">
                <ArrowDownUp size={15} />
                Потенциал
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5 py-4 xl:grid-cols-4">
            {[
              ["Лидов", String(stats.total), "пилотная база"],
              ["Высокий приоритет", String(stats.high), "70+ баллов"],
              ["Контакты", String(stats.contacts), "корпоративные"],
              ["Нужно проверить", String(stats.check), "confidence ниже 70"],
            ].map(([label, value, hint]) => (
              <div
                key={label}
                className="rounded-md border border-[#d9dde5] bg-white p-3"
              >
                <div className="text-xs text-[#667085]">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
                <div className="text-xs text-[#667085]">{hint}</div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <div className="overflow-x-auto rounded-md border border-[#d9dde5] bg-white">
              <table className="min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f7f9] text-xs uppercase text-[#667085]">
                  <tr>
                    {[
                      "Приоритет",
                      "Компания",
                      "ИНН",
                      "Район",
                      "Контакт",
                      "Потенциал",
                      "Статус",
                      "Источник",
                    ].map((head) => (
                      <th key={head} className="border-b border-[#d9dde5] px-3 py-2">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-[#eef0f3] ${
                        lead.id === selectedLead.id ? "bg-[#fff8f8]" : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-mono text-xs font-bold ${
                            lead.score.priorityScore >= 70
                              ? "bg-[#c8102e] text-white"
                              : "bg-[#f1f3f6] text-[#1d1d1f]"
                          }`}
                        >
                          {lead.score.priorityScore}
                        </span>
                      </td>
                      <td className="max-w-[240px] px-3 py-3">
                        <div className="font-semibold">{lead.shortName}</div>
                        <div className="truncate text-xs text-[#667085]">
                          {lead.okved}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{lead.inn}</td>
                      <td className="px-3 py-3">{lead.district}</td>
                      <td className="px-3 py-3">
                        <div>{lead.phone}</div>
                        <div className="text-xs text-[#667085]">
                          {lead.corporateEmail}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {rub(lead.score.budgetRangeRub[0])}-
                        {rub(lead.score.budgetRangeRub[1])}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md border border-[#d9dde5] px-2 py-1 text-xs">
                          {statusLabels[lead.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#667085]">
                        {lead.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="border-t border-[#d9dde5] bg-white lg:border-l lg:border-t-0">
          <div className="flex h-16 items-center justify-between border-b border-[#d9dde5] px-4">
            <div>
              <div className="text-xs text-[#667085]">Карточка лида</div>
              <h2 className="text-lg font-semibold">{selectedLead.shortName}</h2>
            </div>
            <Building2 className="text-[#c8102e]" size={22} />
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-md border border-[#f0c8d0] bg-[#fff8f8] p-3">
              <div className="flex gap-2 text-sm font-semibold text-[#9f0d24]">
                <AlertTriangle size={17} />
                Непроверенные данные не считать согласием на рассылку
              </div>
              <p className="mt-2 text-xs leading-5 text-[#667085]">
                Персональные контакты скрываются из XLSX до ручной проверки.
                Используйте только публичные корпоративные каналы.
              </p>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Реквизиты</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-[#667085]">ИНН</dt>
                  <dd className="font-mono">{selectedLead.inn}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#667085]">ОГРН</dt>
                  <dd className="font-mono">{selectedLead.ogrn}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-[#667085]">Адрес</dt>
                  <dd>{selectedLead.address}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Страховой интерес</h3>
              <div className="rounded-md border border-[#d9dde5] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Приоритет</span>
                  <strong className="text-2xl text-[#c8102e]">
                    {selectedLead.score.priorityScore}
                  </strong>
                </div>
                <p className="mt-2 text-sm text-[#667085]">
                  {selectedLead.score.explanation}
                </p>
                <div className="mt-3 text-sm">
                  Бюджет: {rub(selectedLead.score.budgetRangeRub[0])}-
                  {rub(selectedLead.score.budgetRangeRub[1])} руб.
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Контакты</h3>
              <div className="space-y-2 text-sm">
                <div className="rounded-md border border-[#d9dde5] p-3">
                  <div>{selectedLead.phone}</div>
                  <div className="text-[#667085]">{selectedLead.corporateEmail}</div>
                </div>
                <div className="rounded-md border border-dashed border-[#d9dde5] p-3 text-[#667085]">
                  Персональные контакты: требуют проверки
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Источники</h3>
              <div className="space-y-2">
                <a
                  className="flex items-center justify-between rounded-md border border-[#d9dde5] p-3 text-sm"
                  href={selectedLead.sourceUrl}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileSearch size={16} />
                    {selectedLead.source}
                  </span>
                  <span className="font-mono text-xs">
                    {selectedLead.confidence}%
                  </span>
                </a>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Активность</h3>
              <div className="flex gap-2 rounded-md border border-[#d9dde5] p-3 text-sm">
                <CalendarClock size={16} className="mt-0.5 text-[#667085]" />
                <div>
                  <div>{selectedLead.agentComment}</div>
                  <div className="text-xs text-[#667085]">
                    Обновлено {selectedLead.lastUpdated}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center gap-2 rounded-md bg-[#f6f7f9] p-3 text-xs text-[#667085]">
              <ShieldCheck size={15} />
              Расчетный потенциал не является подтвержденным бюджетом клиента.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
