# AI Fashion Stylist (Multi‑Modal) — ARCH.md

## 1) Topology
- **Frontend/BFF:** Next.js 14 (Vercel). Server Actions for signed S3 uploads, SSR for lookbooks, ISR for shared boards.
- **API Gateway:** NestJS (Node 20) — REST /v1, Zod validation, RBAC (Casbin), RLS by user_id, Problem+JSON, Idempotency‑Key, Request‑ID (ULID).
- **Workers (Python 3.11 + FastAPI control):**
  - `vision-worker`: segmentation (Mask‑RCNN/YOLO‑seg), background removal, OCR (size tags), attributes, CLIP embeddings.
  - `dedupe-worker`: pHash + embedding cluster (HDBSCAN).
  - `reco-worker`: outfit graph search + constraints (occasion/weather/budget/body) + multi‑objective optimizer.
  - `fit-worker`: brand size maps, silhouette guidance, fit deltas from feedback.
  - `catalog-worker`: retailer sync (price, stock, variants), affiliate link generator.
  - `weather-worker`: forecast fetch & cache (unit/locale aware).
  - `export-worker`: PDF/JSON/ICS lookbook, packing lists.
- **Event bus:** NATS topics (`media.ingest`, `item.embed`, `item.cluster`, `outfit.make`, `fit.calc`, `catalog.sync`, `weather.update`, `export.make`) + Redis Streams (progress/SSE).
- **Data:** Postgres 16 + pgvector (users, items, outfits, embeddings, events), S3/R2 (originals, masks, thumbnails, exports), Redis (sessions, caches); optional ClickHouse for analytics.
- **Observability:** OpenTelemetry traces/metrics/logs; Prometheus/Grafana; Sentry.

## 2) Data Model (Postgres + pgvector)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY, email CITEXT UNIQUE, name TEXT, tz TEXT, country TEXT,
  style_tags TEXT[], budget_range INT4RANGE, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE body_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id), height_cm INT, weight_kg INT,
  measurements JSONB, silhouette TEXT, updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE items (
  id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), title TEXT, brand TEXT,
  category TEXT, color TEXT[], pattern TEXT, fabric TEXT, size TEXT, notes TEXT,
  image_s3 TEXT, mask_s3 TEXT, phash TEXT, attributes JSONB, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE item_embeddings (
  item_id UUID PRIMARY KEY REFERENCES items(id),
  clip VECTOR(768), color_lab VECTOR(3), style VECTOR(128)
);

CREATE TABLE outfits (
  id UUID PRIMARY KEY, user_id UUID, name TEXT, occasion TEXT, season TEXT,
  score NUMERIC, rationale TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE outfit_items (
  outfit_id UUID REFERENCES outfits(id), item_id UUID, slot TEXT, PRIMARY KEY(outfit_id, slot)
);

CREATE TABLE catalog_products (
  id UUID PRIMARY KEY, retailer TEXT, product_id TEXT, name TEXT, brand TEXT,
  category TEXT, price_cents INT, currency TEXT, url TEXT, image_url TEXT,
  size_map JSONB, color TEXT[], sustainability TEXT[], availability JSONB,
  embedding VECTOR(768), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shop_links (
  outfit_id UUID, product_id UUID, reason TEXT, score NUMERIC, PRIMARY KEY(outfit_id, product_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY, user_id UUID, title TEXT, date DATE, location TEXT, dress_code TEXT
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY, user_id UUID, action TEXT, target TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
```

**Invariants:**
- RLS on `user_id` across wardrobe/outfits.  
- Outfit must include ≥ top/bottom (or dress/jumpsuit) + footwear.  
- Shop links require in‑stock & locale‑compatible currency.  
- Face‑blur before storing images (unless user opts‑out).

## 3) APIs (REST /v1 — representative)
- **Wardrobe & Media**
  - `POST /media/upload` → signed URL; returns `media_id`.
  - `POST /wardrobe/ingest {media_id}` → returns created `item_ids`.
  - `GET /items`, `PATCH /items/:id`.
- **Styling & Outfits**
  - `POST /outfits/generate {occasion, dress_code?, budget?, weather?:{lat,lon,date}}`
  - `GET /outfits/:id` (items, rationale, alternates).
  - `POST /outfits/:id/feedback {like:boolean, reasons?:[]}`
- **Shopping**
  - `GET /shop/match?item_id=...`
  - `POST /shop/complete-look {outfit_id, gaps:[...]}`
- **Profiles & Events**
  - `PUT /profile/body {...}`
  - `POST /events {...}`
- **Exports**
  - `POST /exports/lookbook {outfit_ids:[...], format:"pdf|json"}`

**Conventions:** Idempotency‑Key; cursor pagination; SSE for batch ingestion progress; Problem+JSON errors.

## 4) Pipelines
1. **Media ingest** → face‑blur (default) → segmentation/mask → attributes/OCR → embeddings.  
2. **Dedupe** → pHash + embedding cluster → user merge UI.  
3. **Reco** → outfit graph + constraints (occasion/weather/budget/body) → optimizer (style score, novelty, re‑wear, cost).  
4. **Fit & Shop** → brand size maps & user deltas → product matches (price/availability) → affiliate links.  
5. **Exports** → lookbook/packing list JSON/PDF/ICS.

## 5) ML/CV Choices
- **Detection/segmentation:** YOLOv8‑seg or Mask‑RCNN; on‑device resize, fast path for single‑item shots.  
- **Attributes:** lightweight classifiers for category/fabric/pattern; color in CIELAB + Pantone‑ish mapping.  
- **Embeddings:** CLIP ViT‑B/32 for retrieval; plus 128‑d “style” vector fine‑tuned with feedback.  
- **Dedupe:** pHash + CLIP cosine + HDBSCAN.  
- **Outfit scoring:** learned compatibility + rules (color wheel, texture/formality).

## 6) Security & Privacy
- SSO (Apple/Google), KMS‑wrapped secrets, signed S3 URLs, per‑user envelope encryption for media.  
- NSFW/sensitive filter; **private items** flags; transparent affiliate usage.  
- GDPR endpoints (export/delete); immutable audit log.

## 7) Performance & SLOs
- Ingest & analyze photo < **2.5 s p95** (GPU).  
- Generate 6‑piece outfit set < **1.5 s p95**.  
- Catalog availability check < **600 ms p95** (cached).  
- Lookbook export (10 outfits) < **5 s p95**.

## 8) Testing
- CV unit: segmentation IoU, attribute P/R, OCR accuracy.  
- Reco: acceptance A/B; rule compliance; weather/formality constraints.  
- Fit: size map correctness on gold charts; calibration from feedback.  
- Catalog: stock/price staleness; link validity.  
- E2E: ingest → dedupe → outfit → shop → export.  
- Security: RLS coverage; media access policy; blur default verified.

## 9) Deployment
- FE on Vercel; APIs/workers on GKE/Fly/Render (GPU pool for `vision-worker`); Redis+NATS; Postgres+pgvector; S3/R2; OTel + Grafana; blue/green deploys.
