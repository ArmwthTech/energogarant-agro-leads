# Contact Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add contact candidates with confidence/source/status and fix XLSX export headers.

**Architecture:** Keep the first pass in the existing Next.js app. Extend `contact-enrichment.ts` to return a best contact plus candidate list, keep current API shape backward-compatible, and export source/confidence/status columns.

**Tech Stack:** Next.js App Router, TypeScript, ExcelJS, existing assert-based `npm test`.

---

### Task 1: Contact Candidate Model

**Files:**
- Modify: `src/lib/contact-enrichment.ts`
- Modify: `src/domain/agro.test.ts`

- [ ] **Step 1: Write tests for candidate scoring**

Add assertions that a page matching INN/OGRN gives high-confidence official contacts and unmatched directory contacts are retained as `needs_check`.

- [ ] **Step 2: Implement minimal candidate fields**

Add `ContactCandidate` with `value`, `kind`, `sourceType`, `sourceUrl`, `confidence`, `status`.

- [ ] **Step 3: Keep compatibility**

Keep `ContactInfo.phone`, `corporateEmail`, `website`, `contactSourceUrl`, and add `candidates`.

### Task 2: XLSX Export

**Files:**
- Modify: `src/domain/agro.ts`
- Modify: `src/lib/export.ts`
- Modify: `src/domain/agro.test.ts`

- [ ] **Step 1: Add export columns**

Add `contactStatus`, `contactConfidence`, `contactSource`.

- [ ] **Step 2: Add Russian headers**

Map technical keys to Russian XLSX headers.

- [ ] **Step 3: Verify workbook**

Download `/api/export`, read with ExcelJS, assert sheet exists, rows > 1, Russian headers exist.

### Task 3: UI Status

**Files:**
- Modify: `src/app/leads-dashboard.tsx`
- Modify: `src/app/lead/[inn]/page.tsx`

- [ ] **Step 1: Show compact contact quality**

Table contact cell shows phone/email plus short confidence/status line.

- [ ] **Step 2: Show detail candidates**

Lead page shows contact status/confidence/source for best found contact.

### Task 4: Verification and Git

**Files:**
- No new source files expected.

- [ ] **Step 1: Run tests**

Run `npm test`.

- [ ] **Step 2: Build**

Run `npm run build`.

- [ ] **Step 3: Browser smoke**

Check local page, lead detail, export.

- [ ] **Step 4: Commit and push**

Commit one focused implementation commit and push `codex/initial-mvp`.
