AI Fashion Stylist (Multi-Modal) — upload wardrobe pics → AI suggests outfits & purchase links 

 

1) Product Description & Presentation 

One-liner 

“Snap your wardrobe, set the vibe, and get shoppable outfits—styled for your body, occasion, weather, and budget.” 

What it produces 

Clean wardrobe catalog: detected items (category, color, pattern, fabric, brand, condition) from photos. 

Styled outfit sets: tops/bottoms/outerwear/shoes/accessories with rationale, fit notes, and alternates. 

Size & fit guidance: brand-specific size suggestions + body-shape tips. 

Shoppable matches: in-stock purchase links for missing pieces; price, delivery ETA, returns policy. 

Exports: Lookbook PDF, packing lists, calendar outfits, and JSON bundle (items, embeddings, outfits, links). 

Scope/Safety 

Multi-modal assistant; no medical/fashion body shaming; inclusive sizing. 

Photos processed with on-upload face blurring (toggleable). 

User controls: local deletion, account wipe, “private mode” (no catalog sync). 

 

2) Target User 

Everyday users who want quick, stylish outfits from what they already own. 

Creators & stylists building capsules and affiliate lists. 

Retailers/marketplaces embedding in shopping apps to boost attach rate. 

 

3) Features & Functionalities (Extensive) 

Wardrobe Ingestion (Multi-Modal CV) 

Batch upload: photos, short videos, screenshots of orders; EXIF parsing. 

Segmentation: person/garment mask → background removal; multi-item detection (YOLO/Mask-RCNN). 

Landmarks & attributes: category (tee, chino, Chelsea boot), color (Pantone-ish), pattern (stripe/print), fabric, style tags (minimalist/streetwear). 

De-duplication: CLIP embeddings + perceptual hash; cluster near-dupes. 

Metadata capture: brand, size tag OCR, condition, purchase date, price (optional). 

Styling & Recommendations 

Outfit graph: compatibility edges (category + color wheel + texture rules + formality). 

Constraints: occasion, dress code, weather & temperature, budget, luggage count, laundry cadence. 

Optimization: multi-objective (style score, novelty, re-wear frequency, cost). 

Explainable suggestions: “Monochrome base + contrast shoe; echoes jacket hardware.” 

Alternates: swap items for weather/body-shape; show “own vs shop” options. 

Size & Fit 

Body profile: height/weight/measurements (optional), silhouette (pear/athletic/etc.—opt-in). 

Brand size maps: normalize disparate size charts; warn for vanity sizing. 

Fit delta: current wardrobe fit notes → calibrate shop suggestions. 

Shopping & Affiliate 

Catalog match: similar items by embedding; filters (price, brand, sustainability). 

Retail integrations: Shopify/BigCommerce/Commerce APIs + affiliate networks (Awin/Rakuten/Impact). 

Stock & variants: size/color availability, shipping ETA, return window. 

Bundles: “Complete the look” cart. 

Personalization & Routines 

Capsule builder: minimal set that yields max outfits. 

Calendar outfit planner: sync events; auto outfits with pack list for trips. 

Feedback loop: like/skip reasons → retrain personal style vector. 

Privacy & Safety 

Face blur + background matte; NSFW & sensitive content filter. 

“Private items” flag (excluded from any shared boards). 

Transparent use of affiliate links; opt-out at account level. 

 

4) Backend Architecture (Extremely Detailed & Deployment-Ready) 

4.1 Topology 

Frontend/BFF: Next.js 14 (Vercel) with Server Actions for signed uploads, SSR for lookbooks, ISR for shared boards. 

API Gateway: NestJS (Node 20) — REST /v1, OpenAPI 3.1, Zod validation, RBAC (Casbin), RLS by user_id, Problem+JSON, Idempotency-Key, Request-ID (ULID). 

Workers (Python 3.11 + FastAPI control) 

vision-worker (segmentation, landmarks, OCR, attribute classification, CLIP embeddings). 

dedupe-worker (pHash + embedding cluster). 

reco-worker (outfit graph search, constraints, MOO optimizer). 

fit-worker (size maps, body profile inference). 

catalog-worker (retailer sync, availability, pricing). 

weather-worker (forecast fetch & cache; unit locale). 

export-worker (PDF/JSON/ICS lookbook, packing lists). 

Event bus: NATS topics (media.ingest, item.embed, item.cluster, outfit.make, fit.calc, catalog.sync, weather.update, export.make) + Redis Streams (progress/SSE). 

Data 

Postgres 16 + pgvector (users, items, outfits, embeddings, events). 

S3/R2 (original media, masks, thumbnails, exports). 

Redis (sessions, rate limits, cache for weather and stock checks). 

Optional: ClickHouse (engagement analytics). 

Observability: OpenTelemetry (traces/metrics/logs), Prometheus/Grafana; Sentry. 

Secrets: Cloud KMS; retailer tokens; per-user envelope encryption for media. 

4.2 Data Model (Postgres + pgvector) 

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
  

Invariants 

RLS on user_id across wardrobe/outfits. 

Each outfit must include at least top/bottom (or dress/jumpsuit) + footwear. 

Shop links require in-stock and locale-compatible currency. 

Face-blur performed before storing any images (unless user opts out). 

4.3 API Surface (REST /v1) 

Wardrobe & Media 

POST /media/upload → signed URL; returns media_id. 

POST /wardrobe/ingest {media_id} → returns created item_ids. 

GET /items?user_id=... / PATCH /items/:id (edit attributes). 

Styling & Outfits 

POST /outfits/generate {occasion, dress_code?, budget?, weather?:{lat,lon,date}} 

GET /outfits/:id (items, rationale, alternates). 

POST /outfits/:id/feedback {like:boolean, reasons?:[]} 

Shopping 

GET /shop/match?item_id=... (similar products) 

POST /shop/complete-look {outfit_id, gaps:["belt","coat"]} 

Profiles & Events 

PUT /profile/body {height_cm, weight_kg, measurements, silhouette} 

POST /events {title,date,location,dress_code} 

Exports 

POST /exports/lookbook {outfit_ids:[...], format:"pdf|json"} 

Conventions: Idempotency-Key; cursor pagination; SSE progress on batch ingestion. 

4.4 Pipelines & Logic 

Media ingest → background removal → detection → attributes → embeddings. 

Dedupe → cluster pHash/embedding → prompt user to merge. 

Reco → build outfit candidates via outfit graph + constraints (occasion/weather/budget/body). 

Size & Shop → map sizes; find catalog matches; filter by price & availability; attach affiliate link. 

Export → generate lookbook/packing list with rationale and links. 

4.5 Security & Compliance 

SSO (Apple/Google); per-user encryption; signed S3 URLs; GDPR delete/export endpoints. 

NSFW filter; opt-in sharing; audit trail for all exports/links. 

 

5) Frontend Architecture (React 18 + Next.js 14 — Looks Matter) 

5.1 Design Language 

shadcn/ui + Tailwind with glass cards, neon accents, soft shadows; dark mode default. 

Framer Motion micro-interactions: floating fabric swatches, animated color wheels, springy outfit tiles. 

Interactive collages: drag items to remix; “swap” with fluid morph transitions. 

5.2 App Structure 

/app 
  /(marketing)/page.tsx 
  /(auth)/sign-in/page.tsx 
  /(app)/wardrobe/page.tsx 
  /(app)/style/page.tsx           // preferences & body profile 
  /(app)/outfits/page.tsx 
  /(app)/outfits/[id]/page.tsx 
  /(app)/shop/page.tsx 
  /(app)/planner/page.tsx         // calendar & trips 
  /(app)/exports/page.tsx 
/components 
  UploadTray/*            // batch drag-drop with progress & blur toggle 
  ItemCard/*              // masked item on glass card, quick edit 
  ColorPatternChip/*      // animated swatches 
  OutfitGrid/*            // responsive grid, swap slots 
  ReasonPill/*            // rationale badges 
  WeatherChip/*           // temp/precip icon with motion 
  FitAdvisor/*            // size hints & brand notes 
  ShopCarousel/*          // purchase links with availability 
  CapsuleWizard/*         // choose N items → max outfits 
  Planner/*               // calendar with outfit pins & pack list 
  ExportWizard/*          // PDF/lookbook theme selector 
/store 
  useWardrobeStore.ts 
  useOutfitStore.ts 
  useShopStore.ts 
  usePlannerStore.ts 
/lib 
  api-client.ts 
  sse-client.ts 
  zod-schemas.ts 
  rbac.ts 
  

5.3 Key UX Flows 

Wardrobe Onboarding: upload → real-time mask preview → attribute chips animate in → user confirms/edits. 

Style Setup: pick vibes (classic, street, quiet luxury), colors you love/avoid, body profile & budgets. 

Outfit Generation: choose occasion/date → live weather chip → animated outfit tiles appear with rationale + alternates. 

Remix & Save: drag items to swap; long-press to show color harmony overlay; save to board. 

Shop the Gap: “Complete the look” carousel with size availability; add to retailer cart (new tab) or copy list. 

Planner: drag outfits onto calendar events; auto pack list; export PDF. 

5.4 Validation & Errors 

Zod forms; Problem+JSON toasts; guard rails: blur on by default; warning if multi-person photo detected. 

Graceful degradation in low light/occlusion; suggest retakes with tips. 

5.5 A11y & i18n 

High-contrast palettes; keyboard controls (←/→ swap items, S to save outfit). 

Screen-reader alt text from attributes (“Navy wool blazer with notch lapel”). 

Localized sizes (US/EU/UK/JP) & currencies. 

 

6) SDKs & Integration Contracts 

Upload media & ingest 

POST /v1/media/upload 
{ "contentType":"image/jpeg" } -> { "uploadUrl":"...", "media_id":"..." } 
 
POST /v1/wardrobe/ingest 
{ "media_id":"UUID" } -> { "item_ids":["UUID", "..."] } 
  

Generate outfits 

POST /v1/outfits/generate 
{ 
  "occasion":"smart-casual", 
  "date":"2025-09-05", 
  "location":"Stockholm, SE", 
  "budget_cents_max": 30000 
} 
  

Match shopping items 

GET /v1/shop/match?item_id=UUID&price_max=15000&retailers=asos,zar a 
  

Update body profile 

PUT /v1/profile/body 
{ "height_cm":178, "measurements":{"chest":98,"waist":82}, "silhouette":"athletic" } 
  

Export lookbook 

POST /v1/exports/lookbook 
{ "outfit_ids":["UUID","UUID"], "format":"pdf", "theme":"neon-glass" } 
  

JSON bundle keys: items[], item_embeddings[], outfits[], outfit_items[], shop_links[], events[]. 

 

7) DevOps & Deployment 

FE: Vercel (Next.js). 

APIs/Workers: GKE/Fly/Render; GPU pool for vision-worker; autoscale on queue depth; DLQ with jitter. 

DB: Managed Postgres + pgvector; PITR; read replicas. 

Cache/Bus: Redis + NATS. 

Storage/CDN: S3/R2 with lifecycle rules; CDN image resizing. 

CI/CD: GitHub Actions (lint/typecheck/unit/integration, vuln scan, sign, deploy); blue/green; migration approvals. 

Operational SLOs 

Ingest & analyze photo < 2.5 s p95 (GPU). 

Generate 6-piece outfit set < 1.5 s p95. 

Catalog availability check < 600 ms p95 (cached). 

Lookbook export (10 outfits) < 5 s p95. 

 

8) Testing 

CV unit: segmentation IoU, attribute precision/recall, OCR accuracy on size tags. 

Reco: offline A/B on outfit acceptance; rule compliance (formality/weather). 

Fit: brand size mapping correctness vs gold charts. 

Catalog: stock/price staleness; link validity. 

Integration: ingest → dedupe → outfit → shop → export. 

E2E (Playwright): batch upload → style set → outfits → planner → lookbook. 

Load/Chaos: burst uploads, retailer API rate limits; graceful backoff & caching. 

Security: RLS coverage; media access policy; face-blur on by default test. 

 

9) Success Criteria 

Product KPIs 

Time to first outfit < 2 min from first upload. 

Outfit save/like rate ≥ 45% on first session. 

“Shop the gap” CTR ≥ 20%, conversion uplift vs control ≥ 8%. 

Wardrobe utilization (distinct items worn in generated outfits) +30% in 30 days. 

Engineering SLOs 

Pipeline success ≥ 99% excl. corrupt images. 

Misclassification rate (category) < 5% on validation set. 

Out-of-stock link rate < 3% (24h rolling). 

 

10) Visual/Logical Flows 

A) Capture → Catalog 

 Upload wardrobe pics → face blur + segmentation → attributes & embeddings → dedupe clusters → user confirms items. 

B) Style Setup 

 Select vibes, colors, body profile, budgets → saved to profile → personalize style vector. 

C) Outfit Generation 

 Pick occasion/date/location → weather fetched → optimizer builds outfit candidates → show tiles with rationale + alternates. 

D) Shop the Gap 

 Detect missing category/accessory → match catalog (size/price/availability) → present purchase links & cart handoff. 

E) Plan & Export 

 Pin outfits to calendar/trip → auto pack list → export neon-glass lookbook PDF or JSON bundle. 

 

 