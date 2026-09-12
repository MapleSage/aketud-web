import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* AKETUD has no blog and no case-study collection (split out of
   maplesage-web, which had both — dropped here as dead weight since no
   page in this repo references either). If either comes back, restore the
   `blog`/`cases` collection defs from maplesage-web's content.config.ts. */

/* -------------------------------------------------------------- settings */
const link = z.object({ label: z.string(), href: z.string() });

/* Mega-menu tree — up to 3 levels (item → group → link). */
const menuLink = z.object({ label: z.string(), href: z.string().optional() });
const menuGroup = menuLink.extend({ children: z.array(menuLink).default([]) });
const menuItem = menuLink.extend({ children: z.array(menuGroup).default([]) });

const footerColumn = z.object({
  heading: z.string(),
  href: z.string().optional(),   // when set, the heading itself is a link (a single-page column)
  links: z.array(link).default([]),
});
const icon = z.object({ path: z.string(), viewBox: z.string() });
const socialLink = link.extend({ icon: icon.optional() });

const settings = defineCollection({
  loader: glob({ base: './src/content/settings', pattern: '*.json' }),
  schema: z.object({
    nav: z.array(link),                       // legacy flat nav (editorial Nav.astro / blog)
    navCta: link,
    menu: z.array(menuItem).default([]),      // Elevate mega-menu
    footerLinks: z.array(link),
    footerColumns: z.array(footerColumn).default([]),
    address: z.string().optional(),
    social: z.array(socialLink).default([]),
    contactEmail: z.string(),
    locations: z.string(),
    org: z.string(),
    // brand assets — the only per-brand *paths* the theme components read;
    // colours/type live in src/styles/brands/*.css instead
    logo: z.string().default('/aketud-logo.png'),
    logoWhite: z.string().default('/aketud-logo-white.png'),
    // Blog listing page size (/insights, topic archives) — a real setting,
    // not a hardcoded number, so it's editable from the CMS the same way
    // HubSpot's blog settings expose "posts per listing page".
    postsPerPage: z.number().int().positive().default(12),
  }),
});

/* ---------------------------------------------------------------- pages */
const section = z.object({
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  body: z.array(z.string()).default([]),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '*.json' }),
  // one object shape covers every page; unused keys are simply absent
  schema: z.object({
    // shared
    metaTitle: z.string(),
    metaDescription: z.string(),
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    intro: z.string().optional(),

    // services / values — plain heading+body lists (about.json)
    services: z.array(z.object({
      heading: z.string(), sub: z.string().optional(), body: z.string().optional(),
      bullets: z.array(z.string()).optional(), stat: z.string().optional(),
      linkText: z.string().optional(), href: z.string().optional(),
      media: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
      mediaSide: z.enum(['left', 'right']).optional(),
      tone: z.enum(['base', 'tint', 'dark']).optional(),
    })).optional(),
    servicesHeading: z.string().optional(),
    valuesHeading: z.string().optional(),
    values: z.array(z.object({ heading: z.string(), body: z.string() })).optional(),

    // home — a reorderable list of typed blocks (the "page builder" model).
    // Add a new block type here, in Section.astro, and in the CMS `sections`
    // field's `types:` list — see the comment at the top of Section.astro.
    blocks: z.array(z.discriminatedUnion('type', [
      z.object({
        type: z.literal('hero'),
        eyebrow: z.string().optional(), title: z.string(), sub: z.string().optional(),
        variant: z.enum(['split', 'full']).optional(), dark: z.boolean().optional(),
        ctaPrimary: link.optional(), ctaSecondary: link.optional(),
        media: z.object({
          type: z.enum(['image', 'video']), src: z.string(),
          webm: z.string().optional(), poster: z.string().optional(), alt: z.string().optional(),
        }).optional(),
      }),
      z.object({
        type: z.literal('serviceRow'),
        heading: z.string(), sub: z.string().optional(), body: z.string().optional(),
        bullets: z.array(z.string()).optional(), stat: z.string().optional(),
        linkText: z.string().optional(), href: z.string().optional(),
        media: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
        mediaSide: z.enum(['left', 'right']).optional(),
        tone: z.enum(['base', 'tint', 'dark']).optional(),
      }),
      z.object({
        type: z.literal('featureList'),
        id: z.string().optional(),
        eyebrow: z.string().optional(), sub: z.string().optional(),
        items: z.array(z.object({
          heading: z.string(), body: z.string(), icon: z.string().optional(), iconSrc: z.string().optional(),
        })),
      }),
      z.object({
        type: z.literal('iconGrid'),
        eyebrow: z.string().optional(), heading: z.string().optional(),
        columns: z.union([z.literal(4), z.literal(5)]).optional(),
        items: z.array(z.object({ iconSrc: z.string(), label: z.string() })),
      }),
      z.object({
        type: z.literal('logoWall'),
        eyebrow: z.string().optional(),
        logos: z.array(z.object({ src: z.string(), alt: z.string(), href: z.string().optional() })),
      }),
      z.object({
        type: z.literal('testimonials'),
        eyebrow: z.string().optional(), heading: z.string().optional(),
        items: z.array(z.object({
          quote: z.string(), name: z.string(), role: z.string().optional(),
          avatar: z.string().optional(), image: z.string().optional(),
          linkText: z.string().optional(), href: z.string().optional(),
        })),
      }),
      z.object({
        type: z.literal('recentPosts'),
        eyebrow: z.string().optional(), heading: z.string().optional(),
        viewAllHref: z.string().optional(), count: z.number().optional(),
      }),
      z.object({
        type: z.literal('ctaBand'),
        eyebrow: z.string().optional(), heading: z.string(), body: z.string().optional(),
        ctaPrimary: link, ctaSecondary: link.optional(),
        tone: z.enum(['accent', 'dark', 'light']).optional(),
      }),
    ])).optional(),

    // generic section list (insurance / retail / work / about)
    sections: z.array(section).optional(),
    steps: z.array(z.object({ heading: z.string(), body: z.string() })).optional(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    cta: z.object({ eyebrow: z.string(), line: z.string(), body: z.string().optional(), button: link }).optional(),

    // long-form prose (workplace policy, legal) — array of {heading?, body[]} blocks
    prose: z.array(z.object({
      heading: z.string().optional(),
      body: z.array(z.string()),
    })).optional(),
  }),
});

/* -------------------------------------------------------------- products */
const products = defineCollection({
  loader: glob({ base: './src/content/products', pattern: '*.json' }),
  schema: z.object({
    order: z.number(),
    slug: z.enum(['platform', 'pas', 'uw', 'fnol', 'atlas']),
    no: z.string(),
    domain: z.string(),
    eyebrow: z.string(),
    name: z.string(),
    sector: z.string(),
    lead: z.string(),
    dark: z.boolean().default(false),
    heroVideo: z.string().optional(),   // R2 base name -> /cdn/hero/<name>.{webm,mp4,jpg}
    architecture: z.array(z.string()),
    stack: z.array(z.string()),
    screens: z.array(z.object({
      src: z.string().optional(), alt: z.string(), caption: z.string(),
    })),
  }),
});

export const collections = { settings, pages, products };
