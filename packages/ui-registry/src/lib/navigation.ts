import { UIComponentRef } from '@ecommerce/schema';

/**
 * Navigation editor helpers.
 *
 * After the owner designs every page, each section/button is "navigable" but has no
 * real destination yet. The navigation editor lists every such button across the
 * shop's pages and lets the owner pick a destination page + subpage, which we turn
 * into a URL written back into the button's own prop (`link` / `ctaLink` / …). The
 * storefront render path already reads those props, so no storefront change needed.
 */

// Props that always represent a navigation target, regardless of schema metadata.
// Covers HeaderMenuItem.link / AnnouncementBar.link (declared as plain text) and
// the various CTA props on sections.
const LINK_PROPS = ['link', 'ctaLink', 'viewAllLink', 'href', 'url'];

// Components that are inherently a single navigable button, so we surface them even
// when their link prop is still empty.
const BUTTON_COMPONENTS = ['Button', 'HeaderMenuItem'];

// For a given link prop, which sibling prop holds the human-readable label.
const LABEL_FOR_LINK: Record<string, string[]> = {
  ctaLink: ['ctaText'],
  viewAllLink: ['viewAllText'],
  link: ['label', 'text', 'title'],
  href: ['label', 'text', 'title'],
  url: ['label', 'text', 'title'],
};

export interface NavButtonRow {
  /** Stable identity for React keys + applying edits back. */
  id: string;
  /** 'global' for the shared header, otherwise the page key (home, product_listing…). */
  location: 'global' | string;
  pageKey: string;
  /** Id of the top-level section this button belongs to. */
  sectionId: string;
  /** Display name of the section (schema name). */
  sectionLabel: string;
  /** Id of the node that actually owns the prop (section id, or nested block id). */
  nodeId: string;
  /** Set when the button is a nested block rather than the section itself. */
  blockLabel?: string;
  /** Prop key the URL is written into. */
  propKey: string;
  /** Button text shown in the table. */
  label: string;
  /** Current value of the prop. */
  currentLink: string;
}

export const DESTINATION_PAGES = [
  'home',
  'all-products',
  'collections',
  'products',
  'pages',
  'cart',
  'profile',
  'wishlist',
  'custom',
] as const;

export type DestinationPage = (typeof DESTINATION_PAGES)[number];

/** Page types whose destination requires picking a concrete subpage (slug/id). */
export const PAGES_WITH_SUBPAGE: DestinationPage[] = ['collections', 'products', 'pages'];

/** Build a storefront-relative URL from a chosen destination page + optional subpage. */
export function buildUrl(pageType: DestinationPage | string, subSlug?: string): string {
  const slug = (subSlug || '').trim();
  switch (pageType) {
    case 'home':
      return '/';
    case 'all-products':
      return '/all-products';
    case 'collections':
      return slug ? `/collections/${slug}` : '/collections';
    case 'products':
      return slug ? `/products/${slug}` : '/all-products';
    case 'pages':
      return slug ? `/pages/${slug}` : '/';
    case 'cart':
      return '/cart';
    case 'profile':
      return '/profile';
    case 'wishlist':
      return '/wishlist';
    case 'custom':
    default:
      return slug || '/';
  }
}

/** Best-effort inverse of buildUrl, used to prefill the selects from an existing link. */
export function parseUrl(url: string): { pageType: DestinationPage; subSlug?: string } {
  const u = (url || '').trim();
  if (!u || u === '/') return { pageType: 'home' };
  const clean = u.split('?')[0].split('#')[0];
  const segments = clean.replace(/^\/+/, '').split('/').filter(Boolean);
  const [head, ...rest] = segments;
  switch (head) {
    case 'all-products':
      return { pageType: 'all-products' };
    case 'collections':
      return { pageType: 'collections', subSlug: rest[0] };
    case 'products':
      return { pageType: 'products', subSlug: rest[0] };
    case 'pages':
      return { pageType: 'pages', subSlug: rest[0] };
    case 'cart':
      return { pageType: 'cart' };
    case 'profile':
      return { pageType: 'profile' };
    case 'wishlist':
      return { pageType: 'wishlist' };
    default:
      return { pageType: 'custom', subSlug: u };
  }
}

function schemaName(componentId: string, schemaRegistry: Record<string, any>): string {
  return schemaRegistry?.[componentId]?.name || componentId;
}

function targetPropKeys(node: UIComponentRef, schemaRegistry: Record<string, any>): string[] {
  const keys = new Set<string>();
  const settings: any[] = schemaRegistry?.[node.componentId]?.settings || [];
  for (const s of settings) {
    if (s?.type === 'page_selector' && s?.id) keys.add(s.id);
  }
  const props = node.props || {};
  for (const k of LINK_PROPS) {
    if (props[k] !== undefined && props[k] !== '') keys.add(k);
  }
  if (BUTTON_COMPONENTS.includes(node.componentId)) keys.add('link');
  return [...keys];
}

function labelForNode(node: UIComponentRef, propKey: string, fallback: string): string {
  const props = node.props || {};
  const candidates = [...(LABEL_FOR_LINK[propKey] || []), 'label', 'text', 'title', 'ctaText'];
  for (const c of candidates) {
    if (typeof props[c] === 'string' && props[c].trim()) return props[c].trim();
  }
  return fallback;
}

function rowsForNode(
  node: UIComponentRef,
  ctx: { location: 'global' | string; pageKey: string; sectionId: string; sectionLabel: string; isBlock: boolean },
  schemaRegistry: Record<string, any>,
): NavButtonRow[] {
  return targetPropKeys(node, schemaRegistry).map((propKey) => {
    const fallback = ctx.isBlock ? schemaName(node.componentId, schemaRegistry) : ctx.sectionLabel;
    return {
      id: `${ctx.location}:${node.id}:${propKey}`,
      location: ctx.location,
      pageKey: ctx.pageKey,
      sectionId: ctx.sectionId,
      sectionLabel: ctx.sectionLabel,
      nodeId: node.id,
      blockLabel: ctx.isBlock ? schemaName(node.componentId, schemaRegistry) : undefined,
      propKey,
      label: labelForNode(node, propKey, fallback),
      currentLink: String(((node.props || {}) as Record<string, any>)[propKey] ?? ''),
    };
  });
}

function walkBlocks(
  blocks: UIComponentRef[] | undefined,
  ctx: { location: 'global' | string; pageKey: string; sectionId: string; sectionLabel: string },
  schemaRegistry: Record<string, any>,
  out: NavButtonRow[],
) {
  for (const block of blocks || []) {
    out.push(...rowsForNode(block, { ...ctx, isBlock: true }, schemaRegistry));
    walkBlocks(block.blocks, ctx, schemaRegistry, out);
  }
}

/**
 * Collect every navigable button/link across the shop's editable pages (and the
 * shared header menu items) into flat rows for the navigation editor table.
 */
export function collectNavigableButtons(
  pages: Record<string, UIComponentRef[]>,
  globalComponents: UIComponentRef[],
  schemaRegistry: Record<string, any>,
): NavButtonRow[] {
  const out: NavButtonRow[] = [];

  const visitSections = (sections: UIComponentRef[], location: 'global' | string, pageKey: string) => {
    for (const section of sections || []) {
      const sectionLabel = schemaName(section.componentId, schemaRegistry);
      const ctx = { location, pageKey, sectionId: section.id, sectionLabel };
      out.push(...rowsForNode(section, { ...ctx, isBlock: false }, schemaRegistry));
      walkBlocks(section.blocks, ctx, schemaRegistry, out);
    }
  };

  for (const [pageKey, sections] of Object.entries(pages || {})) {
    visitSections(sections, pageKey, pageKey);
  }

  // Shared header menu items are navigation too; footer (compound link strings) is
  // intentionally left to a future pass.
  const header = (globalComponents || []).find((c) => c.componentId === 'Header');
  if (header) {
    visitSections([header], 'global', 'global');
  }

  return out;
}
