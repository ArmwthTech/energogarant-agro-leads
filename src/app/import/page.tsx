export default function ImportPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] p-8">
      <section className="mx-auto max-w-3xl rounded-md border border-[#d9dde5] bg-white p-6">
        <h1 className="text-2xl font-semibold">Импорт и обновление</h1>
        <p className="mt-2 text-[#667085]">
          MVP запускает сбор только по открытым источникам без обхода капчи:
          ЕГРЮЛ, сайты компаний и закупки.
        </p>
        <div className="mt-5 rounded-md border border-[#d9dde5] p-4 text-sm">
          Cron endpoint: <code>/api/cron/import</code>
        </div>
      </section>
    </main>
  );
}
