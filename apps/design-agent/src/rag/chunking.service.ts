import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ShopPageLayout, UIComponentRef } from '@ecommerce/schema';

/** A page_layouts document as we read it back from MongoDB. */
export interface PageLayoutRecord {
  figma_node_id: string;
  name?: string;
  tenant_id?: string | null;
  page: ShopPageLayout;
}

/** One retrievable chunk = one top-level section of a page. */
export interface LayoutChunk {
  /** Stable id `${page_id}::${section_id}` — the upsert key for embeddings. */
  chunk_id: string;
  page_id: string;
  section_id: string;
  tenant_id: string | null;
  figma_node_id: string;
  page_name: string;
  section_name: string;
  /** Registry componentId of the section (e.g. "Hero", "FeaturedProducts"). */
  section_type: string;
  page_type: string;
  order: number;
  /** The natural-language text that gets embedded. */
  content: string;
  /** sha256 of `content` — lets the index job skip unchanged chunks. */
  content_hash: string;
}

const DEFAULT_TENANT = 'default';

/**
 * Turns a `page_layouts` document into one chunk per top-level section
 * (`page.components[i]`). The chunk text follows a fixed template so semantically
 * similar sections embed close together, and carries the metadata the retrieval
 * layer needs to filter by tenant/page and cite a `section_id`.
 */
@Injectable()
export class LayoutChunkerService {
  chunkPage(doc: PageLayoutRecord): LayoutChunk[] {
    const page = doc.page;
    const pageId = doc.figma_node_id;
    const tenantId = doc.tenant_id ?? null;
    const pageName = doc.name ?? page.slug ?? page.pageType ?? 'Untitled page';
    const pagePath = page.slug ?? page.pageType ?? '';
    const components = Array.isArray(page.components) ? page.components : [];

    return components.map((section, idx) => {
      const sectionId = section.id ?? `${pageId}-section-${idx}`;
      const sectionType = section.componentId;
      const sectionName = sectionLabel(section);
      const componentList = describeComponents(section);
      const registryRefs = collectComponentIds(section);

      const content =
        `Tenant: ${tenantId ?? DEFAULT_TENANT}. ` +
        `Page: ${pageName} (${pagePath}). ` +
        `Section: ${sectionName} (${sectionType}). ` +
        `Components: ${componentList.join(', ')}. ` +
        `UI Registry refs: ${registryRefs.join(', ')}.`;

      return {
        chunk_id: `${pageId}::${sectionId}`,
        page_id: pageId,
        section_id: sectionId,
        tenant_id: tenantId,
        figma_node_id: pageId,
        page_name: pageName,
        section_name: sectionName,
        section_type: sectionType,
        page_type: page.pageType ?? '',
        order: section.order ?? idx,
        content,
        content_hash: sha256(content),
      };
    });
  }
}

/** Prefer a human title from props, fall back to the registry componentId. */
function sectionLabel(c: UIComponentRef): string {
  const props = (c.props ?? {}) as Record<string, unknown>;
  for (const key of ['title', 'heading', 'label', 'name', 'text']) {
    const v = props[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return c.componentId;
}

/** Flatten the section subtree into "componentId (type)" strings, in order. */
function describeComponents(root: UIComponentRef): string[] {
  const out: string[] = [];
  const walk = (c: UIComponentRef): void => {
    out.push(`${c.componentId} (${c.type ?? 'section'})`);
    for (const b of c.blocks ?? []) walk(b);
  };
  walk(root);
  return out;
}

/** Unique registry componentIds referenced anywhere in the section subtree. */
function collectComponentIds(root: UIComponentRef): string[] {
  const ids = new Set<string>();
  const walk = (c: UIComponentRef): void => {
    if (c.componentId) ids.add(c.componentId);
    for (const b of c.blocks ?? []) walk(b);
  };
  walk(root);
  return [...ids];
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
