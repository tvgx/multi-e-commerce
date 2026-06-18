import { ShopPageLayout, UIComponentRef } from './layout.schema';

/**
 * Component ids that belong in the *global* layout (shared header/footer/bar)
 * rather than a single page. Mirrors api-core's seeded global components.
 */
const GLOBAL_COMPONENT_IDS = new Set(['Header', 'Footer', 'AnnouncementBar']);

/** Stable ids the builder expects for the two singleton global sections. */
const GLOBAL_ID_BY_COMPONENT: Record<string, string> = {
  Header: 'global-header',
  Footer: 'global-footer',
};

/** Prop keys (any nesting) we scan to infer a theme colour/font. */
const COLOR_KEYS = ['backgroundColor', 'primaryColor'];
const FONT_KEYS = ['fontFamily'];

/** Prop keys (any nesting) that hold an image URL — used to pick a preview. */
export const IMAGE_PROP_KEYS = [
  'backgroundImageUrl',
  'imageUrl',
  'url',
  'imageBefore',
  'imageAfter',
  'logoUrl',
];

export interface ConvertedTheme {
  /** Shape of GlobalLayout.draftData. */
  global: { theme: Record<string, unknown>; globalComponents: UIComponentRef[] };
  /** pageType -> components (each becomes a PageLayout.draftData `{ components }`). */
  pages: Record<string, UIComponentRef[]>;
}

/**
 * Convert design-agent Figma extractions ({@link ShopPageLayout} per frame,
 * the `page_layouts` collection shape) into the editor draft shape the builder
 * loads: a single global `{ theme, globalComponents }` plus per-pageType
 * component arrays. Header/Footer/AnnouncementBar are hoisted out of pages into
 * `globalComponents` (deduped — first occurrence wins). Pure + side-effect free
 * so it can run in both api-core and design-agent.
 */
export function convertExtractionsToTheme(
  pages: ShopPageLayout[],
): ConvertedTheme {
  const globalComponents: UIComponentRef[] = [];
  const seenGlobal = new Set<string>();
  const outPages: Record<string, UIComponentRef[]> = {};

  for (const page of pages) {
    const pageComponents: UIComponentRef[] = [];
    for (const comp of page.components ?? []) {
      if (GLOBAL_COMPONENT_IDS.has(comp.componentId)) {
        if (seenGlobal.has(comp.componentId)) continue;
        seenGlobal.add(comp.componentId);
        const id = GLOBAL_ID_BY_COMPONENT[comp.componentId] ?? comp.id;
        globalComponents.push({ ...comp, id, type: 'section' });
      } else {
        pageComponents.push(comp);
      }
    }
    // Re-index visual order top-to-bottom after removing global components.
    pageComponents.forEach((c, i) => (c.order = i));
    // Last frame of a given pageType wins (e.g. duplicate "home" frames).
    outPages[page.pageType] = pageComponents;
  }

  // Header first, Footer last so the storefront renders them in place.
  globalComponents.sort(
    (a, b) => globalRank(a.componentId) - globalRank(b.componentId),
  );

  return {
    global: { theme: inferTheme(pages), globalComponents },
    pages: outPages,
  };
}

function globalRank(componentId: string): number {
  if (componentId === 'AnnouncementBar') return 0;
  if (componentId === 'Header') return 1;
  if (componentId === 'Footer') return 3;
  return 2;
}

/**
 * Best-effort theme metadata pulled from the extracted props: the first font
 * and a representative colour. Falls back to nothing — the builder fills its
 * own defaults. `shopName` is intentionally omitted; callers set the real shop
 * name when applying.
 */
function inferTheme(pages: ShopPageLayout[]): Record<string, unknown> {
  const theme: Record<string, unknown> = {};
  for (const page of pages) {
    for (const comp of page.components ?? []) {
      scanProps(comp, theme);
      if ('fontFamily' in theme && 'primaryColor' in theme) return theme;
    }
  }
  return theme;
}

function scanProps(comp: UIComponentRef, theme: Record<string, unknown>): void {
  const props = comp.props ?? {};
  if (!theme.fontFamily) {
    for (const key of FONT_KEYS) {
      if (typeof props[key] === 'string') {
        theme.fontFamily = props[key];
        break;
      }
    }
  }
  if (!theme.primaryColor) {
    for (const key of COLOR_KEYS) {
      const val = props[key];
      if (typeof val === 'string' && val.startsWith('#')) {
        theme.primaryColor = val;
        break;
      }
    }
  }
  comp.blocks?.forEach((b) => scanProps(b, theme));
}

/**
 * First image-prop URL found anywhere in a component tree — used as a theme
 * preview thumbnail. Scans {@link IMAGE_PROP_KEYS} on each component and its
 * nested blocks. Returns the first `http(s)` URL or `undefined`.
 */
export function firstImageUrlInComponents(
  components: UIComponentRef[],
): string | undefined {
  const fromComponent = (comp: UIComponentRef): string | undefined => {
    const props = comp.props ?? {};
    for (const key of IMAGE_PROP_KEYS) {
      const val = props[key];
      if (typeof val === 'string' && val.startsWith('http')) return val;
    }
    for (const block of comp.blocks ?? []) {
      const found = fromComponent(block);
      if (found) return found;
    }
    return undefined;
  };
  for (const comp of components ?? []) {
    const found = fromComponent(comp);
    if (found) return found;
  }
  return undefined;
}

/** Preview URL across a set of extracted pages ({@link ShopPageLayout}). */
export function firstImageUrl(pages: ShopPageLayout[]): string | undefined {
  for (const page of pages) {
    const found = firstImageUrlInComponents(page.components ?? []);
    if (found) return found;
  }
  return undefined;
}

/**
 * Turn a human title into a URL-safe slug: lowercase, ASCII-fold Vietnamese
 * diacritics, collapse non-alphanumerics to single hyphens. Callers append a
 * short unique suffix to guarantee a unique `themeId`.
 */
export function slugify(title: string): string {
  return (title || 'theme')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'theme';
}
