import { validateCronSecret } from "@/domain/agro";
import { runOfficialImportBatch } from "@/lib/sources";
import { saveOfficialImportBatch } from "@/lib/repository";

export async function GET(request: Request) {
  const secretCheck = validateCronSecret(
    process.env.CRON_SECRET,
    request.headers.get("authorization"),
  );
  if (secretCheck.status !== 200) {
    return Response.json(
      { error: secretCheck.message },
      { status: secretCheck.status },
    );
  }

  const official = await runOfficialImportBatch();
  const saved = await saveOfficialImportBatch(official.items, official.errors);

  return Response.json({
    ok: true,
    imported: official.items.length,
    saved: saved.saved,
    skipped: official.errors.length,
    errors: official.errors,
    policy: "open-pages-only-no-captcha-bypass",
  });
}
