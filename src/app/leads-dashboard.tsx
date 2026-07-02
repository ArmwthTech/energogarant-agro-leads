"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  ArrowDownUp,
  Building2,
  CalendarClock,
  Download,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe,
  MapPinned,
  MessageCircle,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  TableProperties,
  Users,
} from "lucide-react";
import { type Lead, statusLabels } from "@/data/sample";
import { filterLeadRows, safeSourceUrl, type ScoreResult } from "@/domain/agro";

type ScoredLead = Lead & { score: ScoreResult };
type ContactLookup = {
  phone: string;
  corporateEmail: string;
  website: string;
  contactSourceUrl: string;
};

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

function leadSearchLinks(lead: ScoredLead) {
  const base = `${lead.shortName} ${lead.inn} Ростовская область`;
  return [
    ["Сайт", Globe, lead.website || ""],
    ["Яндекс", Search, `https://yandex.ru/search/?text=${encodeURIComponent(`${base} официальный сайт контакты`)}`],
    ["Google", Search, `https://www.google.com/search?q=${encodeURIComponent(base)}`],
    ["VK", MessageCircle, `https://vk.com/search?c%5Bq%5D=${encodeURIComponent(base)}&c%5Bsection%5D=communities`],
    ["OK", MessageCircle, `https://ok.ru/search?st.query=${encodeURIComponent(base)}`],
    ["2ГИС", MapPinned, `https://2gis.ru/search/${encodeURIComponent(base)}`],
  ] as const;
}

export function LeadsDashboard({ leads }: { leads: ScoredLead[] }) {
  const [items, setItems] = useState(leads);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"priority_desc" | "priority_asc">("priority_desc");
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? "");
  const [contactStatus, setContactStatus] = useState("idle");

  useEffect(() => {
    fetch("/api/leads")
      .then((response) => response.json())
      .then((body: { leads?: ScoredLead[] }) => {
        if (body.leads?.length) setItems(body.leads);
      })
      .catch(() => {});
  }, []);

  const kinds = useMemo(() => Array.from(new Set(items.map((lead) => lead.okved))).sort(), [items]);
  const filtered = useMemo(
    () => filterLeadRows(items, { search, kind, status, sort }),
    [items, search, kind, status, sort],
  );
  const selectedLead = filtered.find((lead) => lead.id === selectedId) ?? filtered[0] ?? items[0];
  const stats = {
    total: items.length,
    filtered: filtered.length,
    high: filtered.filter((lead) => lead.score.priorityScore >= 70).length,
    contacts: filtered.filter((lead) => lead.corporateEmail || lead.phone).length,
  };

  useEffect(() => {
    if (!selectedLead?.inn || selectedLead.phone || selectedLead.corporateEmail || selectedLead.website) return;
    setContactStatus("searching");
    fetch(`/api/contacts?inn=${selectedLead.inn}`)
      .then((response) => response.json())
      .then((contact: ContactLookup) => {
        setItems((current) =>
          current.map((lead) =>
            lead.inn === selectedLead.inn
              ? {
                  ...lead,
                  phone: contact.phone || lead.phone,
                  corporateEmail: contact.corporateEmail || lead.corporateEmail,
                  website: contact.website || lead.website,
                  hasCorporateContact: Boolean(contact.phone || contact.corporateEmail || lead.hasCorporateContact),
                }
              : lead,
          ),
        );
        setContactStatus(contact.phone || contact.corporateEmail || contact.website ? "done" : "empty");
      })
      .catch(() => setContactStatus("empty"));
  }, [selectedLead]);

  if (!selectedLead) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6">
        <section className="rounded-md border border-[#d9dde5] bg-white p-6">
          <h1 className="text-xl font-semibold">Лиды не загружены</h1>
          <p className="mt-2 text-sm text-[#667085]">ЕГРЮЛ не отдал данные, попробуйте обновить страницу.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#1d1d1f]">
      <button
        className="fixed bottom-5 right-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#c8102e] text-white shadow-lg hover:bg-[#9f0d24]"
        title="Наверх"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp size={20} />
      </button>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[76px_minmax(720px,1fr)]">
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
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8102e]">ЭНЕРГОГАРАНТ</div>
              <h1 className="text-xl font-semibold">Лиды АПК Ростовская область</h1>
            </div>
            <a
              href="/api/export"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c8102e] px-3 text-sm font-semibold text-white hover:bg-[#9f0d24]"
            >
              <Download size={16} />
              Экспорт XLSX
            </a>
          </header>

          <div className="border-b border-[#d9dde5] bg-white px-5 py-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(220px,1fr)_180px_160px_150px]">
              <label className="flex h-10 items-center gap-2 rounded-md border border-[#d9dde5] bg-white px-3 text-sm text-[#667085]">
                <Search size={16} />
                <input
                  className="min-w-0 flex-1 outline-none"
                  placeholder="Поиск по компании, ИНН, ОГРН"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select
                className="h-10 rounded-md border border-[#d9dde5] bg-white px-3 text-sm"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                <option value="all">Все типы</option>
                {kinds.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-[#d9dde5] bg-white px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Все статусы</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d9dde5] bg-white text-sm font-medium"
                onClick={() => setSort(sort === "priority_desc" ? "priority_asc" : "priority_desc")}
              >
                <ArrowDownUp size={15} />
                Потенциал
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5 py-4 xl:grid-cols-4">
            {[
              ["Всего", String(stats.total), "ЕГРЮЛ ФНС"],
              ["В фильтре", String(stats.filtered), "сейчас показано"],
              ["Высокий приоритет", String(stats.high), "70+ баллов"],
              ["Контакты", String(stats.contacts), "только проверенные"],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-md border border-[#d9dde5] bg-white p-3">
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
                    {["Приоритет", "Компания", "ИНН", "Тип", "Контакт", "Потенциал", "Статус", "Источник"].map((head) => (
                      <th key={head} className="border-b border-[#d9dde5] px-3 py-2">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`cursor-pointer border-b border-[#eef0f3] ${
                        lead.id === selectedLead.id ? "bg-[#fff8f8]" : "bg-white"
                      }`}
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-mono text-xs font-bold ${
                            lead.score.priorityScore >= 70 ? "bg-[#c8102e] text-white" : "bg-[#f1f3f6] text-[#1d1d1f]"
                          }`}
                        >
                          {lead.score.priorityScore}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-3 py-3">
                        <a
                          className="truncate font-semibold hover:text-[#c8102e]"
                          href={`/lead/${lead.inn}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {lead.shortName}
                        </a>
                        <div className="truncate text-xs text-[#667085]">{lead.name}</div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{lead.inn}</td>
                      <td className="px-3 py-3">{lead.okved}</td>
                      <td className="px-3 py-3 text-xs text-[#667085]">
                        <div>{lead.phone || "телефон не найден"}</div>
                        <div>{lead.corporateEmail || "email не найден"}</div>
                      </td>
                      <td className="px-3 py-3">
                        {rub(lead.score.budgetRangeRub[0])}-{rub(lead.score.budgetRangeRub[1])}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md border border-[#d9dde5] px-2 py-1 text-xs">{statusLabels[lead.status]}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#667085]">{lead.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && <div className="p-5 text-sm text-[#667085]">По этим фильтрам лидов нет.</div>}
            </div>
          </div>
        </section>

        <aside className="border-t border-[#d9dde5] bg-white lg:col-start-2">
          <div className="flex h-16 items-center justify-between border-b border-[#d9dde5] px-4">
            <div>
              <div className="text-xs text-[#667085]">Карточка лида</div>
              <h2 className="line-clamp-1 text-lg font-semibold">{selectedLead.shortName}</h2>
            </div>
            <a
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d9dde5] px-3 text-sm hover:border-[#c8102e] hover:text-[#c8102e]"
              href={`/lead/${selectedLead.inn}`}
              target="_blank"
              rel="noreferrer"
            >
              <Building2 className="text-[#c8102e]" size={18} />
              Открыть
            </a>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-md border border-[#f0c8d0] bg-[#fff8f8] p-3">
              <div className="flex gap-2 text-sm font-semibold text-[#9f0d24]">
                <AlertTriangle size={17} />
                Непроверенные данные не считать согласием на рассылку
              </div>
              <p className="mt-2 text-xs leading-5 text-[#667085]">
                Персональные контакты скрываются из XLSX до ручной проверки.
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
                  <dt className="text-xs text-[#667085]">Руководитель</dt>
                  <dd>{selectedLead.director}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Контакты</h3>
              <div className="rounded-md border border-[#d9dde5] p-3 text-sm">
                <div>{selectedLead.phone || "Телефон не найден в открытых источниках"}</div>
                <div className="mt-1 text-[#667085]">
                  {selectedLead.corporateEmail || "Email не найден в открытых источниках"}
                </div>
                <div className="mt-2 text-xs text-[#667085]">
                  {contactStatus === "searching" && "Ищу сайт, телефон и email..."}
                  {contactStatus === "empty" && "Открытая проверка не нашла контакты."}
                  {contactStatus === "done" && "Найдено автоматически, требуется ручная проверка."}
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Страховой интерес</h3>
              <div className="rounded-md border border-[#d9dde5] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Приоритет</span>
                  <strong className="text-2xl text-[#c8102e]">{selectedLead.score.priorityScore}</strong>
                </div>
                <p className="mt-2 text-sm text-[#667085]">{selectedLead.score.explanation}</p>
                <div className="mt-3 text-sm">
                  Бюджет: {rub(selectedLead.score.budgetRangeRub[0])}-{rub(selectedLead.score.budgetRangeRub[1])} руб.
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Источники</h3>
              <a
                className="flex items-center justify-between rounded-md border border-[#d9dde5] p-3 text-sm"
                href={safeSourceUrl(selectedLead.sourceUrl)}
                rel="noreferrer"
                target="_blank"
              >
                <span className="inline-flex items-center gap-2">
                  <FileSearch size={16} />
                  {selectedLead.source}
                </span>
                <span className="font-mono text-xs">{selectedLead.confidence}%</span>
              </a>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Поиск сайта и соцсетей</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {leadSearchLinks(selectedLead).map(([label, Icon, href]) =>
                  href ? (
                    <a
                      key={label}
                      className="inline-flex h-10 items-center justify-between gap-2 rounded-md border border-[#d9dde5] px-3 text-sm hover:border-[#c8102e] hover:text-[#c8102e]"
                      href={href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon size={15} />
                        {label}
                      </span>
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span
                      key={label}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d9dde5] px-3 text-sm text-[#98a2b3]"
                    >
                      <Icon size={15} />
                      Сайт не найден
                    </span>
                  ),
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Активность</h3>
              <div className="flex gap-2 rounded-md border border-[#d9dde5] p-3 text-sm">
                <CalendarClock size={16} className="mt-0.5 text-[#667085]" />
                <div>
                  <div>{selectedLead.agentComment}</div>
                  <div className="text-xs text-[#667085]">Обновлено {selectedLead.lastUpdated}</div>
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
