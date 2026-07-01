# energogarant-agro-leads

MVP веб-приложения для ведения страховых лидов АПК Ростовской области от лица ЭНЕРГОГАРАНТ.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Vercel deployment target
- Neon Postgres через `DATABASE_URL`
- Clerk Auth через Vercel Marketplace env vars
- XLSX export через `/api/export`
- Cron import endpoint: `/api/cron/import`

## Local

```bash
npm ci
npm test
npm run build
npm run dev
```

## Env

Copy `.env.example` to `.env.local` and fill values from Vercel integrations.

The MVP intentionally does not bypass captcha or anti-bot protection. Parsers only use open pages/API and record source confidence.
