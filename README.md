# aketud

Astro 5 static site for **aketud.com** — the insurance product line (main
page, 6 sub-pages, and 5 product detail pages), split out of `maplesage-web`
once that repo's site (maplesage.com) narrowed to just its AFL (Apparel,
Footwear & Luxury / retail) vertical.

Stack (inherited from the parent repo): Astro 5 static · plain CSS + custom
properties · self-hosted fonts (`@fontsource-variable`) · no Tailwind, no UI
kit. Two page systems coexist here (also inherited): the "Elevate" theme
(`src/layouts/ElevateBase.astro` + `src/components/elevate/*`) renders the
insurance pages; the older "dark editorial" theme (`src/layouts/Base.astro` +
`src/components/{Nav,Footer,Grain,ScreenSlot}.astro`) renders the 5 product
detail pages (`/platform`, `/pas`, `/uw`, `/fnol`, `/atlas`) — a
pre-existing inconsistency in the parent repo, not something introduced by
the split. Porting the product pages to Elevate is open work, not done here.

## Branding

The current **A + trend-line + AKETUD** lockup (icon, black badge, wordmark,
no tagline) is installed across the shared site chrome. Several brand-asset
rounds preceded this one — see git history on `public/admin/config.yml`-
adjacent commits if you need the older black-badge-with-tagline or
stacked-icon-over-wordmark iterations.
- `public/aketud-logo-blue.png` and `public/aketud-logo-white.png` are the
  primary navy and inverse lockups used by the shared headers and footers —
  cropped/recolored derivatives of the supplied
  `public/Aketud.favicon.v2.svg` (a white lockup on a black badge, meant for
  dark backgrounds; the navy variant recolors the wordmark to platform navy
  `#001B3D` while keeping the badge black, for use on the light header).
  `scripts/generate_aketud_blue_assets.py` no longer reflects how these are
  produced — it reads from `public/brand/aketud-logo-source.png`, an
  unrelated, earlier source.
- `public/favicon.svg`/`.ico`/`favicon-*.png` (browser tab icons) are a
  cropped, transparent-background render of the supplied
  `public/Aketud New Logo Design (Logo).svg` — a two-tone mark (navy
  pyramid + teal trend-line), which needed a chroma-key pass first: the
  source file renders with an unintended opaque black rectangle behind the
  mark (present at every render resolution tried; not an antialiasing
  fluke), so pure-black pixels are dropped before cropping.
  `apple-touch-icon.png`, `icon-512.png`, `pwa-maskable-512x512.png`, and
  `favicon.png` (opaque app-icon contexts) composite the same cleaned mark
  onto a rounded off-white tile — a dark tile doesn't work here since the
  mark's own navy is dark. A mono-teal alternative was also tried
  (`public/Aketud teal-favicon.svg` → cleaned copy at
  `public/aketud-favicon-teal-mono.png`) but reads poorly against dark
  backgrounds, so it isn't wired in anywhere — the two-tone version is.
- `src/styles/brands/aketud.css` supplies the platform-led tonal blue palette:
  midnight application chrome, cloud-blue surfaces, and restrained operational
  teal. The homepage has an AKETUD-specific “AI You Can Accept” hero while
  preserving the existing page and product architecture.

Remaining brand and site caveats:
- Legal copy (`src/content/pages/workplace-policy.json`, `privacy.astro`,
  `terms.astro`) says "AKETUD" but was written for MapleSage originally —
  have this reviewed by whoever owns AKETUD's actual legal entity/policies
  before treating it as real.
- `public/admin/config.yml` (Sveltia CMS) is now rewritten for this repo:
  `backend.repo`/`base_url`/`site_url`/`display_url` point at
  `MapleSage/aketud-web` and `aketud.com` (they previously pointed at
  `maplesage-web` / `maplesage.com`, which is why `/admin` opened and edited
  the old site), and the `pages`/`products`/`settings` collections match
  this repo's actual `src/content/*` schema instead of the parent repo's
  (blog, retail pages, etc., none of which exist here). Make sure the
  GitHub OAuth App's callback URL is `https://www.aketud.com/oauth/callback`
  to match the new `base_url`.

## Deploy

Separate git-connected Cloudflare Pages project (`aketud`, or whatever it's
named on Cloudflare) — push to `main`, Pages builds `npm run build` → `dist`.

- **Domain**: `aketud.com` + `www.aketud.com` as custom domains on this
  Pages project, once DNS is pointed here (proxied CNAME → this project's
  `.pages.dev`, or however this Cloudflare account's zone is set up).
- `astro.config.mjs` `site:` is `https://www.aketud.com`.
- `functions/_middleware.js` is currently a no-op passthrough — no blog
  rewrite, no per-domain routing, no product-subdomain split (unlike the
  parent repo). Real per-domain routing lives in maplesage-web's
  `_middleware.js` if that pattern is ever needed here.
- `functions/api/contact.js` (`CONTACT_TO`/`CONTACT_FROM` default to
  `info@aketud.com`/`no-reply@aketud.com` — confirm those mailboxes exist,
  or set the env vars), `functions/cdn/[[path]].js` (R2 asset proxy — needs
  its own R2 bucket binding if any content here starts referencing `/cdn/`
  paths; nothing does yet), `functions/oauth/*` (Sveltia CMS GitHub OAuth)
  all carried over from the parent repo unchanged.

### Environment variables (Pages → Settings → Variables)

| Var | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Sveltia CMS GitHub OAuth (`functions/oauth/`) |
| `CONTACT_TO` | contact-form destination (default `info@aketud.com`) |
| `CONTACT_FROM` | contact-form envelope from (default `no-reply@aketud.com`) |
| `MAIL_ENDPOINT` / `MAIL_TOKEN` | SMTP-over-HTTP bridge for `functions/api/contact.js` |
| — or — `SEND_EMAIL` binding | Cloudflare Email Routing `send_email` (needs a verified `CONTACT_TO`) |

## Pages

| Route | Source | Content |
|---|---|---|
| `/` | `pages/index.astro` | Insurance Operations overview (`content/pages/insurance.json`) |
| `/digital` | `pages/digital.astro` | `insurance-digital.json` |
| `/innovate` | `pages/innovate.astro` | `insurance-innovate.json` |
| `/sageinsure` | `pages/sageinsure.astro` | `insurance-sageinsure.json` |
| `/qa-testing` | `pages/qa-testing.astro` | `insurance-qa-testing.json` |
| `/modernization` | `pages/modernization.astro` | `insurance-modernization.json` |
| `/adm` | `pages/adm.astro` | `adm.json` |
| `/platform` `/pas` `/uw` `/fnol` `/atlas` | `pages/[product].astro` ← `content/products/*.json` | product detail pages, dark-editorial theme |
| `/contact` | posts to `functions/api/contact.js` | |
| `/privacy` `/terms` `/workplace-policy` | | legal (needs real review — see Branding) |
| `/admin` | Sveltia CMS, GitHub backend | config in `public/admin/` — needs a rewrite, see Branding |

No blog, no case-study collection, no retail/AFL content — all dropped when
this repo was split out (they're `maplesage-web`'s content, not this
site's).

## Dev

```
npm install
npm run dev      # http://localhost:4321
npm run build
```
