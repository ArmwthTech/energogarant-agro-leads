"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  ArrowDownUp,
  Download,
  Gauge,
  RefreshCw,
  Search,
  Settings,
  TableProperties,
  Users,
} from "lucide-react";
import { type Lead, statusLabels } from "@/data/sample";
import { filterLeadRows, type ScoreResult } from "@/domain/agro";

type ScoredLead = Lead & { score: ScoreResult };
type ContactLookup = {
  phone: string;
  corporateEmail: string;
  website: string;
  contactSourceUrl: string;
};

const nav = [
  { label: "Лиды", icon: TableProperties, href: "/", active: true },
  { label: "Импорт", icon: RefreshCw, href: "/import" },
  { label: "Отчеты", icon: Gauge, href: "/reports" },
  { label: "Агенты", icon: Users, href: "/agents" },
  { label: "Настройки", icon: Settings, href: "/settings" },
];

function rub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function LeadsDashboard({ leads }: { leads: ScoredLead[] }) {
  const [items, setItems] = useState(leads);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"priority_desc" | "priority_asc">("priority_desc");
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? "");
  const [contactStatus, setContactStatus] = useState("idle");
  const [activeLookup, setActiveLookup] = useState(false);
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((response) => response.json())
      .then((body: { leads?: ScoredLead[] }) => {
        if (body.leads?.length) setItems(body.leads);
      })
      .catch(() => {})
      .finally(() => setLoadingLive(false));
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
    if (!activeLookup || !selectedLead?.inn || selectedLead.phone || selectedLead.corporateEmail || selectedLead.website) return;
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
  }, [selectedLead, activeLookup]);

  async function lookupVisibleContacts() {
    setActiveLookup(true);
    setContactStatus("searching");
    for (const lead of filtered.filter((item) => !item.phone && !item.corporateEmail && !item.website).slice(0, 20)) {
      try {
        const contact = (await fetch(`/api/contacts?inn=${lead.inn}`).then((response) => response.json())) as ContactLookup;
        setItems((current) =>
          current.map((item) =>
            item.inn === lead.inn
              ? {
                  ...item,
                  phone: contact.phone || item.phone,
                  corporateEmail: contact.corporateEmail || item.corporateEmail,
                  website: contact.website || item.website,
                  hasCorporateContact: Boolean(contact.phone || contact.corporateEmail || item.hasCorporateContact),
                }
              : item,
          ),
        );
      } catch {}
    }
    setContactStatus("done");
  }

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
              <a
                key={item.label}
                href={item.href}
                className={`grid h-12 place-items-center rounded-md border text-[#667085] transition ${
                  item.active
                    ? "border-[#c8102e] bg-[#fff1f3] text-[#c8102e]"
                    : "border-transparent hover:border-[#d9dde5] hover:bg-[#f6f7f9]"
                }`}
                title={item.label}
              >
                <item.icon size={20} />
              </a>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex min-h-16 flex-col gap-3 border-b border-[#d9dde5] bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8102e]">ЭНЕРГОГАРАНТ</div>
              <h1 className="text-xl font-semibold">Лиды АПК Ростовская область</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d9dde5] bg-white px-3 text-sm font-semibold hover:border-[#c8102e] hover:text-[#c8102e]"
                onClick={lookupVisibleContacts}
                type="button"
              >
                <RefreshCw size={16} />
                {contactStatus === "searching" ? "Проверяю..." : "Проверить контакты"}
              </button>
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
              ["Всего", loadingLive ? `${stats.total}+` : String(stats.total), loadingLive ? "загружаю ЕГРЮЛ" : "ЕГРЮЛ ФНС"],
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
              <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col className="w-[96px]" />
                  <col className="w-[300px]" />
                  <col className="w-[96px]" />
                  <col className="w-[90px]" />
                  <col className="w-[120px]" />
                  <col className="w-[140px]" />
                  <col className="w-[104px]" />
                  <col className="w-[174px]" />
                </colgroup>
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
                          className="block truncate font-semibold hover:text-[#c8102e]"
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
                      <td className="truncate px-3 py-3 text-xs text-[#667085]">{lead.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && <div className="p-5 text-sm text-[#667085]">По этим фильтрам лидов нет.</div>}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
