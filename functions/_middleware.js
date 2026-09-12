// AKETUD is its own standalone site/repo (split out of maplesage-web, which
// hosted this content at maplesage.com/insurance and its 6 sub-pages before
// the whole insurance vertical moved here). No blog, no per-domain routing,
// no product-subdomain split — every real page lives at its own top-level
// path (/, /digital, /innovate, /sageinsure, /qa-testing, /modernization,
// /adm, /platform, /pas, /uw, /fnol, /atlas). This file is a placeholder for
// whatever real routing AKETUD needs later (redirects, A/B tests, etc.) —
// today it's a no-op passthrough.
export async function onRequest(context) {
  return context.next();
}
