# AI Fashion Stylist (Multi‑Modal) — PLAN.md

## 1) Vision & Value
**One‑liner:** “Snap your wardrobe, set the vibe, and get shoppable outfits—styled for your body, occasion, weather, and budget.”  
**Core value:** Turn messy closet photos into a clean catalog and generate explainable, inclusive outfit suggestions, while filling gaps with in‑stock shopping links.

## 2) Target Users
- Everyday users who want quick, stylish outfits from what they already own.  
- Creators/stylists building capsules & affiliate lists.  
- Retailers/marketplaces embedding styling to boost attach rate.

## 3) Problem → Solution
- **Problem:** Outfit paralysis, under‑used wardrobe, hard size/fit decisions, shopping noise.  
- **Solution:** Computer vision → structured wardrobe; optimization + style rules → outfits; body profile + brand maps → fit; affiliate/catalog → shop the gaps; planner/exports → action.

## 4) Scope (MVP → GA)
### MVP (private beta)
- Batch photo upload with **face‑blur on by default**; background removal; per‑item attributes (category, color, pattern, fabric, brand, size tag OCR).
- Dedupe clusters; manual merge.
- Outfit generation for 4 occasions (casual, smart‑casual, business‑casual, evening) with weather & budget constraints.
- Fit guidance (basic size normalization + silhouette tips); inclusive sizing language.
- “Shop the gap” for **tops/bottoms/outerwear/shoes** via 1–2 retailer integrations (read‑only affiliate links).
- Exports: Lookbook PDF (theme presets), JSON bundle; basic calendar (ICS) for planned outfits.
- Privacy: local deletion, account wipe, “private items” flag; NSFW/sensitive filter.

### Post‑MVP (GA)
- Creator mode (capsules, share boards), multi‑city trip planner, price tracking, more retailers, sustainability filters, multi‑user households, internal style vector fine‑tuning.

## 5) Success Metrics (60–90 days)
- **Time to first outfit** < 2 min from first upload.  
- **Outfit save/like rate** ≥ 45% first session.  
- **Shop‑the‑gap CTR** ≥ 20%; out‑of‑stock rate < 3% (24h rolling).  
- **Wardrobe utilization** (distinct items used in generated outfits) +30% in 30 days.  
- Crash‑free sessions ≥ 99.5%; pipeline success ≥ 99% (excl. corrupt images).

## 6) Risks & Mitigations
- **CV misclassification/poor photos** → user edit UI; retake tips; conservative defaults; human‑readable rationales.  
- **Sizing inaccuracies** → brand charts + user feedback loop; warn on vanity sizing; store per‑brand deltas.  
- **Retail stock/price drift** → cache + freshness window; availability checks; graceful fallbacks.  
- **Privacy concerns** → default blur, private mode, per‑item privacy flags, GDPR delete/export.  
- **Bias/body shaming** → inclusive style language; no body‑negativity or medical claims; opt‑in body profile.

## 7) Phased Roadmap (high‑level)
- **Sprint 0 (2 wks):** Design system, data model, signed uploads, face‑blur pipeline, skeleton UI.  
- **Sprint 1 (2 wks):** Segmentation + attributes + embeddings; dedupe; basic outfit generator; weather service.  
- **Sprint 2 (2 wks):** Fit advisor v1; retailer #1; shop‑the‑gap; lookbook export.  
- **Sprint 3 (2 wks):** Planner + ICS; feedback loop; reliability hardening; beta launch.

## 8) Go‑To‑Market
- Waitlist → private beta with onboarding flow; creator partnerships with affiliate revenue share; retailer pilot(s).  
- Content: “capsule builder” challenges, travel pack lists, seasonal lookbooks.

## 9) Non‑Goals (MVP)
- No live try‑on or AR.  
- No bespoke tailors/alterations provider marketplace.  
- No social feed/follows (creator mode comes later).

## 10) Operating Principles
- Evidence & empathy: explain every outfit choice plainly.  
- Privacy‑first defaults; reversible actions; audit trail.  
- Deterministic pipelines with clear fallbacks; humans can edit anything.
