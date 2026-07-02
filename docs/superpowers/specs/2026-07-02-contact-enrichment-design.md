# Contact enrichment design

Date: 2026-07-02

## Goal

Build the practical contact-enrichment flow for `energogarant-agro-leads`: not personal phones, but the best available way to call a company.

Chosen strategy: maximum coverage with risk labels and manual verification.

## Contact Quality Model

Each found phone/email/site gets explicit provenance:

- `value`: phone, email, or website.
- `kind`: `phone`, `email`, `website`.
- `source_type`: `official_site`, `procurement`, `registry`, `map`, `directory`, `social`, `manual`.
- `source_url`: exact page where the value was found.
- `confidence`: 0-100.
- `status`: `found`, `needs_check`, `verified`, `bad`, `no_answer`.
- `last_checked_at`: manual check timestamp.
- `checked_by`: agent id/email when available.
- `comment`: free agent note.

Rules:

- Official page with matching INN/OGRN: high confidence.
- Procurement/official document with matching INN/OGRN: high confidence.
- Directory/map/social result without INN/OGRN match: low confidence and `needs_check`.
- Manual agent correction wins over scraper output.
- Bad contacts remain stored as `bad` to avoid rediscovery loops.

## Sources

Use open or licensed sources only:

- Official company sites and likely contact paths: `/contacts`, `/kontakty`, `/contact`, `/o-kompanii`.
- Search engines for discovery, with conservative request volume.
- EIS procurement pages and open data.
- Regional ministry/support registries.
- Maps/directories only as low-confidence sources unless API/license allows stronger use.
- VK/OK/social pages as manual discovery links, not automated login bypass.

Do not bypass captcha or anti-bot protections in app code. If a source requires captcha, the system records `blocked_by_captcha` and moves on.

## UX

Lead detail gets a `Contacts for calling` section:

- sorted contact candidates;
- badge for confidence/status;
- source link;
- buttons: `Verified`, `Bad`, `No answer`;
- comment field.

Lead table keeps compact contact status:

- verified phone/email if available;
- otherwise best `needs_check` phone;
- otherwise `not found`.

Export includes phone/email plus source, confidence, and status so agents can filter before calling.

Default call list filter:

- `status = verified`, or
- `confidence >= 70` and `source_type` is not `directory/social`.

## Data Flow

1. Import/create company by INN/OGRN/name.
2. Discover candidate URLs from search and known source patterns.
3. Fetch each allowed URL with timeout and low request volume.
4. Extract phones/emails.
5. Score candidates by source type and INN/OGRN match.
6. Store all candidates, including bad/manual overrides.
7. Agent verifies or rejects.
8. Export/calling views use verified-first sorting.

## Error Handling

- Network timeout: record source failure, keep job running.
- Captcha or 403: record `blocked_by_captcha`, do not retry aggressively.
- Conflicting phones: store all candidates, prefer verified/manual.
- Unknown source: store as `needs_check` with low confidence.
- Duplicate values: dedupe by normalized phone/email and source.

## Minimal Implementation Plan Later

First implementation should be small:

1. Add `contacts` table/model or in-memory equivalent if DB is still not connected.
2. Extend current `findLeadContacts` to return multiple candidates, not one value.
3. Add status/confidence/source columns to export.
4. Add verify/bad/no-answer actions on lead detail.
5. Add tests for scoring, dedupe, and export columns.

Skipped for first pass:

- Paid directory integrations.
- Auto-login social scraping.
- Captcha solving.
- Mass auto-dialer.
- CRM telephony integration.

Add those only after the manual validation loop proves the data is worth scaling.
