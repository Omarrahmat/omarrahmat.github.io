# Fostering Today

Static website for fosteringtoday.com: UK fostering news and guides (in preparation), a directory of fostering agencies and local authority fostering services with the source of every detail shown, free profile claims, and packages for providers.

## What is built

- Directory data as of 27 October 2026: 498 providers. England 150 councils and 248 independent agencies; Scotland 32 councils and 20 agencies; Wales 22 councils, 16 agencies and the Foster Wales network; Northern Ireland 5 HSC Trust services and 4 agencies. 483 have a website, 416 a phone number, 346 a postcode; 247 agencies carry their regulator reference.

- `out/` is the finished website: plain HTML pages (one per provider, pre-rendered for search engines), one CSS file, one small JavaScript file for the search and the forms, `sitemap.xml`, `robots.txt` and a `404.html`.
- Directory data lives in `src/data/providers.json`, generated from the researched files in `data/raw/*.json` by `npm run merge:data`. Every record carries the URLs it was taken from and the date they were checked. Records without a source are rejected by the validator.
- Logos: listings show an initials tile until the provider claims its profile and uploads a logo (free on every tier).
- News: stories live in `data/news/*.json`, compiled by `npm run merge:news` into `src/data/articles.json`; each must carry sources. `data/news-exclude.json` holds stories held back. The top banner shows the latest headlines automatically.
- Paid placement: `data/placements.json` (provider id → tier, areas, end date). Pinned cards are labelled and their outbound links carry `rel="sponsored"`.
- Forms (newsletter, claim, correction, contact) run in **demo mode** until Supabase is connected: they say so on screen and store nothing.

## Build

Requires Node 22. Two ways to build:

```bash
npm run merge:data      # data/raw/*.json -> src/data/providers.json (+ data/merge-report.json)
npm test                # validator tests
npm run build           # static build with scripts/build-static.mjs -> out/
npm run e2e             # browser smoke test of out/ (needs playwright)
npm run merge:news      # data/news/*.json -> src/data/articles.json
npm run build:preview   # single-file clickable preview at docs/preview.html
```

`npm run build` needs only `react`, `react-dom` and `esbuild` and was used to produce the current `out/`. `npm run build:next` is the equivalent Next.js build (`next build` with static export) for when the full dependency set is installed; it produces the same pages.

### Connecting the forms (Supabase)

1. Create a Supabase project and run `supabase/migrations/001_forms.sql` in the SQL editor. It creates four insert-only tables with row-level security: visitors can add a row (only with consent given) and can never read anything back.
2. Copy `.env.example` to `.env`, fill in the project URL and the **anon** key (never the service role key), and rebuild. The values are public by design; the database policies are what protect the data.
3. Read submissions in the Supabase dashboard (Table editor) for now. An admin area with approval workflows is the next build step.

## Hosting

The site is static, so it can be served by any static host. Supabase does not serve websites (its storage returns HTML as a download, not a page), so use Supabase for the database only and host the site on one of these:

- **Cloudflare Pages** (free): create a project from the repository, build command `npm run build`, output directory `out`. `public/_headers` adds security headers.
- **Netlify** (free tier): `netlify.toml` is included; connect the repository and deploy.
- Or upload the `out/` folder to any web host.

Point the `fosteringtoday.com` DNS at the host, and set `metadataBase` in `src/app/layout.tsx` if the domain changes.

If the host cannot run the build (no npm access), run `npm run build` locally and deploy the `out/` folder directly.

## Data pipeline

- `data/raw/<file>.json`: research output, one array per nation or region. Each record has `sources: [{url, retrievedOn, supports}]`.
- `scripts/lib/validate.mjs`: the rules every record must pass (kebab-case id, name, nation, provider type, https URLs, at least one source; drops invalid postcodes, phones, non-generic emails).
- `scripts/merge-data.mjs`: validates, de-duplicates, sorts and writes `src/data/providers.json`; rejected records go to `data/merge-report.json` for review.
- Source labels on the site are derived from the URL: regulator sites (Ofsted, Care Inspectorate, CIW, RQIA, gov.uk) show "Regulator register", the provider's own domain shows "Provider website", anything else "Other public source".

## Not built yet

- Admin area: claim verification, corrections queue, provider self-service editing, logo upload.
- Payments (Stripe), paid placements, advert slots and sponsored labelling logic.
- Newsletter sending and double opt-in; news and guide content (pages are honest placeholders).
- Legal pages contain a draft notice only and need review by a qualified adviser before launch.
- Enquiry routing to providers: the legal basis and consent wording need review before any lead is passed on.
