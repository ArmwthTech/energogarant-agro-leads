export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] p-8">
      <section className="mx-auto max-w-3xl rounded-md border border-[#d9dde5] bg-white p-6">
        <h1 className="text-2xl font-semibold">Настройки скоринга</h1>
        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between border-b border-[#eef0f3] pb-2">
            <span>Масштаб выручки</span>
            <strong>35</strong>
          </div>
          <div className="flex justify-between border-b border-[#eef0f3] pb-2">
            <span>Растениеводство</span>
            <strong>25</strong>
          </div>
          <div className="flex justify-between border-b border-[#eef0f3] pb-2">
            <span>Техника</span>
            <strong>20</strong>
          </div>
          <div className="flex justify-between">
            <span>Корпоративный контакт</span>
            <strong>15</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
