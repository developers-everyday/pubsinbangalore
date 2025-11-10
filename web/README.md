# PubsInBangalore Web

Next.js (App Router) front-end for the AI-enriched Bangalore pub directory. This app consumes Supabase for data, renders locality pillar pages, and hosts admin tools in later phases.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project with the schema from `../db/schema.sql`
- Python 3.10+ to run the enrichment CSV tooling

## Environment Setup

1. Copy the example env file and populate Supabase keys:
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key for client reads
   - `SUPABASE_SERVICE_ROLE_KEY`: service-role key for ingestion scripts (keep server-side only)
   - `SUPABASE_JWT_SECRET`: optional, required for auth-enabled features later

2. Install dependencies and validate lint/type checks:
   ```bash
   npm install
   npm run lint
   npm run typecheck
   ```

## Local Development

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000). The landing page surfaces Phase 1 progress, Supabase connectivity status, and ingestion checklist items.

## Database & Seeds

1. Apply schema:
   ```bash
   supabase db push --file ../db/schema.sql
   ```
2. Seed locality + attribute lookup data:
   ```bash
   supabase db push --file ../db/seeds/localities.sql
   supabase db push --file ../db/seeds/attributes.sql
   ```

Row-level security is enabled for the main tables. Public reads are allowed, while writes are restricted to the service role.

## Data Ingestion Workflow

1. Run the Python ingestion prototype to clean raw scrapes:
   ```bash
   python ../scripts/ingest_csv.py \
     --input /absolute/path/to/Outscraper.csv \
     --output /tmp/pubs-clean.json
   ```

2. Load cleaned data into Supabase:
   ```bash
   npm run import:pubs -- --input /tmp/pubs-clean.json
   ```
   - Uses the service-role key to upsert into `pubs` and `pub_localities`
   - Batch size can be tuned with `IMPORT_BATCH_SIZE`

## Testing & Quality

- `npm run lint` — ESLint checks (Next.js + Tailwind rules)
- `npm run typecheck` — TypeScript compiler check

## Project Structure Highlights

- `src/app/page.tsx` — Phase 1 landing page with Supabase data preview
- `src/lib/supabase/` — Client, server, and typing helpers
- `scripts/import-pubs.ts` — Node CLI to ingest cleaned data
- `../db/` — SQL schema and seed files shared with Supabase
- `../docs/` — Data taxonomy and ingestion rules referenced by the tooling

## Next Phases

- Build locality and pub detail routes with ISR + JSON-LD
- Implement admin dashboard and claim workflow
- Add AI enrichment jobs via Supabase queues / Edge Functions
- Integrate badge generator and sitemap automation for launch readiness
