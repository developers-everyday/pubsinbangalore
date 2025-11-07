# AI Enrichment Pipeline (Phase 4)

This document outlines the workflow for generating AI-enriched content and structured attributes for the Bangalore pubs directory. It complements the data taxonomy and schema already in place (`docs/data-taxonomy.md`, `db/schema.sql`).

## Goals

1. Automate high-quality pub descriptions, FAQ snippets, and schema-ready metadata.
2. Classify enrichment attributes (booleans, tags, ranges) from unstructured inputs such as CSV data and owner submissions.
3. Keep a human-in-the-loop via the admin dashboard, enabling review, overrides, and re-generation.

## High-Level Architecture

```
┌────────────┐    enqueue     ┌────────────────────┐    process    ┌────────────────────┐
│ Admin UI / │──────────────▶│  ai_content_jobs    │──────────────▶│ AI Providers (LLM) │
│ API        │                │  (Supabase table)   │               │ (OpenAI / Claude)  │
└────────────┘                └────────────────────┘               └────────────────────┘
        ▲                                │                                    │
        │                publish         │                                    ▼
        │───────────────────────────────┼────────────────────────────────┐
        │                               ▼                            update
        │                      `pubs`, `pub_attribute_values`, `pub_change_history`
        │
   Admin review tools (approve / reject / re-run) and background scripts (`npm run run:ai-jobs`)
```

## Core Components

### 1. Supabase Tables (already provisioned)

- `ai_content_jobs`: queue of enrichment jobs (`job_type`, `status`, `payload`, `output`, `error`).
- `pub_attribute_values`: structured attribute storage.
- `pub_change_history`: audit trail for automated updates.

### 2. Job Types

Initial focus:

| Job Type     | Purpose                                                     | Output Fields |
|--------------|-------------------------------------------------------------|---------------|
| `description`| Concise marketing copy, tone guidance, highlight bullets    | `pubs.description`, change history |
| `attributes` | Classify enrichment attributes (boolean/tag/range/schedule) | `pub_attribute_values`, `pubs` overrides |
| `faq`        | (Phase 4b) Generate locality-specific FAQ pairs              | `ai_content_jobs.output` (later stored) |
| `schema`     | (Phase 4b) Produce JSON-LD expansions per pub                | `ai_content_jobs.output` |

### 3. Job Status Lifecycle

| Status            | Meaning                                                   |
|-------------------|-----------------------------------------------------------|
| `pending`         | Enqueued, waiting for the worker to pick up               |
| `processing`      | Worker locked the job and is generating output            |
| `awaiting_review` | Output staged in `ai_content_jobs.output`, needs approval |
| `approved`        | Moderator published changes to production tables          |
| `rejected`        | Moderator rejected output (optional reason in `error`)    |
| `failed`          | Worker hit an error; inspect `error` for context          |

### 3. Workflow Steps

1. **Enqueue**: Admin dashboard or API triggers `POST /api/ai/enqueue`, pushing target pub IDs + job types into `ai_content_jobs` (status `pending`).
2. **Process**: `npm run run:ai-jobs` (or a scheduled worker) fetches pending jobs, calls the selected LLM, and stores raw output + status (`processing → completed|failed`).
3. **Stage**: Parsed results are persisted to `ai_content_jobs.output` and the job transitions to `awaiting_review`. No writes hit `pubs` / `pub_attribute_values` until a moderator approves.
4. **Review**: Admin UI highlights diffs (description vs proposed summary, attribute deltas) and lets editors approve (`status → approved`, change history written) or reject (`status → rejected`, optional reason logged). Re-runs reset the job to `pending` and clear any staged output.

## Configuration

Add the following environment variables (see `.env.example`):

- `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY`: used by the worker. The code prefers OpenAI if both exist.
- `AI_MODEL` (optional): override the default model (`gpt-4o-mini` or Claude equivalent).
- `AI_BATCH_LIMIT`: max jobs processed per run (default 5).
- `AI_DRY_RUN=true`: developer mode – no external API calls; deterministic stub data is produced instead.

## Job Runner (`npm run run:ai-jobs`)

Responsible for:

1. Locking a batch of pending jobs (`status = 'processing'`).
2. Fetching all required pub context (existing description, attributes, sample reviews if available).
3. Calling the model with a structured prompt from `src/lib/ai/prompts.ts`.
4. Validating/parsing the JSON response into the expected shape.
5. Updating tables inside a single transaction to preserve consistency.
6. Logging success/failure back to `ai_content_jobs`.

Error handling:

- API/network failures mark job `failed` with a JSON `error` payload.
- Parsing issues produce a retryable failure; the job can be re-run from the admin UI.
- Batch processing stops on repeated provider failures to avoid rate-limit spirals.

## Prompt Strategy (Summary)

- **Description/Highlights**: Provide pub metadata (name, locality, cost, vibe hints) and ask for a 2–3 sentence summary plus 3 bullet highlights.
- **Attribute Classification**: Supply raw attribute hints (CSV columns, analytics) and ask for JSON booleans/ranges/tags matching codes in `docs/data-taxonomy.md`.
- Use system prompts that emphasise JSON validity, no marketing fluff beyond requested lengths, and truthfulness (no hallucinated amenities).

## Admin UX Touchpoints

- Enqueue buttons per pub within admin dashboard (Phase 3).
- Job table showing `status`, `job_type`, `created_at`, `approved_by`, action buttons (re-run, apply, reject).
- Diff view comparing old/new descriptions before final publish (future enhancement).

## Roadmap Alignment

| Phase | Deliverable                                                      |
|-------|------------------------------------------------------------------|
| Phase 3 | Admin moderation views, claim verification (diff UI + approvals live) |
| **Phase 4** | AI jobs API + worker + staged enrichment pipeline (this doc)     |
| Phase 5 | Final QA, public badge generator, schema validation             |

### Implementation Checklist

- [x] Schema support (`ai_content_jobs`, `pub_attribute_values`).
- [ ] AI configuration helpers (`src/lib/ai/client.ts`, prompts, parser).
- [ ] Job enqueue API + admin UI integration.
- [ ] Background job runner script.
- [ ] Admin review & publish flow (Phase 3/4 shared).
- [ ] Telemetry/logging for monitoring run success.

Once these are in place, seeding Supabase with clean CSV data + running the enrichment worker will populate descriptions and attributes automatically. EOF
