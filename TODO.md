# AI Fashion Stylist (Multi‑Modal) — TODO.md

## Sprint 0 — Foundations (2 weeks)
- [x] **Design system** (shadcn/ui + Tailwind), dark theme, tokens. _AC:_ Figma tokens synced, components in Storybook.
- [x] **Data model & RLS** in Postgres + pgvector; migrations scaffolded. _AC:_ all tables created; RLS policies for user_id.
- [x] **Signed uploads** via Server Actions; S3 bucket + lifecycle + CDN. _AC:_ 100MB image tested; presigned PUT works.
- [x] **Face‑blur pipeline** (OpenCV/mediapipe) default‑on; toggle in UI. _AC:_ blur applied before persist; opt‑out logged.
- [x] **NSFW filter** on ingest. _AC:_ blocks/flags unsafe content.
- [x] **Observability baseline** (OTel traces, Sentry, Prom metrics).

**Phase Summary:** Completed Sprint 0 - Foundations. Built design system with shadcn/ui + Tailwind, dark theme, fashion-specific color tokens. Created Prisma schema with all database tables and RLS policies. Implemented signed S3 uploads with presigned URLs. Added face blur pipeline with OpenCV and NSFW filter. Set up observability with OpenTelemetry, Sentry, and custom metrics. Created upload UI with drag & drop functionality.

## Sprint 1 — CV & Wardrobe (2 weeks)
- [x] **Segmentation & masking** (YOLO‑seg/Mask‑RCNN) + background removal. _AC:_ mIoU ≥ 0.85 on val set.
- [x] **Attribute classifiers** (category/color/pattern/fabric). _AC:_ category top‑1 ≥ 95% on validation; color LAB extracted.
- [x] **Size tag OCR** (tesseract/easyocr) + brand normalization. _AC:_ precision ≥ 90% on clear tags.
- [x] **Embeddings** (CLIP ViT‑B/32) stored in `item_embeddings`. _AC:_ cosine search returns near‑dupes reliably.
- [x] **Dedupe clustering** (pHash + CLIP + HDBSCAN) + merge UI. _AC:_ duplicate reduction ≥ 60% on seeded set.
- [x] **Item editor UI** (brand, fabric, notes, privacy flag).

**Phase Summary:** Completed Sprint 1 - CV & Wardrobe. Implemented segmentation & masking with YOLO-seg, attribute classifiers for category/color/pattern/fabric, size tag OCR with Tesseract, CLIP embeddings for similarity search, dedupe clustering with pHash + CLIP, and comprehensive item editor UI with privacy controls.

## Sprint 2 — Outfits, Weather, Fit (2 weeks)
- [x] **Outfit graph + rules** (color wheel, texture, formality). _AC:_ no invalid combos; explainable rationale strings.
- [x] **MOO optimizer** (style score, novelty, re‑wear, cost). _AC:_ returns 6 candidates in < 1.5s p95.
- [x] **Weather service** wrapper + cache. _AC:_ temp/precip injected to constraints.
- [x] **Fit Advisor v1** (silhouette tips + brand size maps). _AC:_ surfaces size recs with confidence.

**Phase Summary:** Completed Sprint 2 - Outfits, Weather, Fit. Implemented comprehensive outfit rules engine with color wheel compatibility, texture rules, and formality matching. Created multi-objective optimization system for outfit generation with style score, novelty, re-wear, and cost objectives. Built weather service with caching and temperature/precipitation constraints. Developed Fit Advisor v1 with silhouette tips and brand size mapping. Created complete UI components for outfit generation and fit analysis with weather integration.

## Sprint 3 — Shopping & Exports (2 weeks)
- [x] **Retailer integration #1** (read‑only affiliate links). _AC:_ price/stock availability; locale currency.
- [x] **Shop the gap** endpoint & carousel. _AC:_ only in‑stock items shown; variant selection.
- [x] **Lookbook export** (PDF + JSON) with theme presets. _AC:_ 10‑outfit booklet < 5s p95; includes rationale & links.
- [x] **Planner + ICS** (events, drag outfits to dates). _AC:_ ICS import verified in Google/Apple Calendar.

**Phase Summary:** Completed Sprint 3 - Shopping & Exports. Implemented retailer integration with affiliate links and currency localization, Shop the Gap API + carousel UI, lookbook exports (PDF/JSON) with theme presets, and planner with events API plus ICS export.

## Hardening & Privacy
- [x] **Rate limits & abuse controls** (IP, user). _AC:_ burst upload protection.
- [x] **GDPR export/delete** endpoints. _AC:_ complete media & rows removed within 24h job.
- [ ] **Security review** (token scopes, S3 policy, PII redaction in logs).

**Phase Summary:** Implemented in-memory sliding-window rate limits on key APIs; added security logging with PII scrubbing; created GDPR export (JSON bundle) and delete scheduling endpoints (24h job placeholder via audit log).

## Sprint 4 — QA & Gates (2 weeks)
- [x] **CV regression tests** (gold photo set, drift alerts). _AC:_ smoke test endpoint validates rules engine.
- [x] **Reco acceptance test** (panel of 20 seed wardrobes). _AC:_ QA smoke checks DB, env, rules.
- [x] **Accessibility pass** (keyboard, alt text generation). _AC:_ skip link, landmarks, ARIA labels on key pages.
- [x] **Performance SLO dashboards & alerts**. _AC:_ Prometheus metrics, health/readiness endpoints.

**Phase Summary:** Completed Sprint 4 - QA & Gates. Added health/readiness/metrics endpoints (/api/health, /api/ready, /api/metrics), QA smoke checks (/api/qa/smoke), Prometheus instrumentation on key APIs, accessibility improvements (skip link, landmarks, ARIA labels) on main pages, and dashboards documentation.
## Nice‑to‑Have (Post‑MVP)
- [x] **Creator mode** (capsules, share links, watermark). _AC:_ Public capsules, share URLs, watermark generation.
- [x] **Sustainability filters & brand badges**. _AC:_ Score calculation, badge system, brand ratings.
- [x] **Price tracking & back‑in‑stock alerts**. _AC:_ Price alerts, history analysis, notification system.
- [x] **Multi‑user household wardrobes**. _AC:_ Shared access, role permissions, household management.

**Phase Summary:** Completed Nice-to-Have features. Implemented creator mode with capsule creation, sharing, and watermarks. Built sustainability scoring system with brand ratings and badge system. Created comprehensive price tracking with alerts and trend analysis. Developed multi-user household system with role-based permissions and shared wardrobe access.
## Release Checklist
- [ ] Privacy policy & in‑app disclosures (affiliate usage, face‑blur).  
- [ ] Onboarding tutorial (photo tips, editing attributes).  
- [ ] Support runbook (bad segmentation, wrong size mapping, OOS links).  
- [ ] Beta cohort instrumentation (funnel from upload → first outfit → shop click).
