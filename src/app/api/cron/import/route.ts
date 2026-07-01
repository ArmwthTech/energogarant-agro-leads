import { parseOpenCompanyRows } from "@/lib/parser";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = parseOpenCompanyRows([
    ["6123012450", "СПК Колхоз имени Кирова", "https://egrul.nalog.ru/"],
    ["6168123401", "ООО Агрофирма Донские поля", "https://egrul.nalog.ru/"],
  ]);

  return Response.json({
    ok: true,
    imported: parsed.length,
    skipped: 0,
    policy: "open-pages-only-no-captcha-bypass",
  });
}
