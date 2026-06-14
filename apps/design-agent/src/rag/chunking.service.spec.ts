import { ShopPageLayout } from '@ecommerce/schema';
import { LayoutChunkerService, PageLayoutRecord } from './chunking.service';

describe('LayoutChunkerService', () => {
  const chunker = new LayoutChunkerService();

  const page: ShopPageLayout = {
    pageType: 'home',
    slug: 'home',
    components: [
      {
        id: 'home-hero',
        componentId: 'Hero',
        type: 'section',
        order: 0,
        props: { title: 'Big Summer Sale' },
        blocks: [
          { id: 'h1', componentId: 'Heading', type: 'block' },
          { id: 'b1', componentId: 'Button', type: 'block' },
        ],
      },
      {
        id: 'feat',
        componentId: 'FeaturedProducts',
        type: 'section',
        order: 1,
      },
    ],
  };

  const doc: PageLayoutRecord = {
    figma_node_id: '12:34',
    name: 'Home',
    tenant_id: 'shop_1',
    page,
  };

  it('produces one chunk per top-level section', () => {
    const chunks = chunker.chunkPage(doc);
    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => c.section_id)).toEqual(['home-hero', 'feat']);
  });

  it('builds the templated chunk text with components and registry refs', () => {
    const [hero] = chunker.chunkPage(doc);
    expect(hero.content).toBe(
      'Tenant: shop_1. Page: Home (home). ' +
        'Section: Big Summer Sale (Hero). ' +
        'Components: Hero (section), Heading (block), Button (block). ' +
        'UI Registry refs: Hero, Heading, Button.',
    );
  });

  it('carries the metadata the retriever needs', () => {
    const [hero] = chunker.chunkPage(doc);
    expect(hero).toMatchObject({
      chunk_id: '12:34::home-hero',
      page_id: '12:34',
      section_id: 'home-hero',
      tenant_id: 'shop_1',
      figma_node_id: '12:34',
      page_name: 'Home',
      section_name: 'Big Summer Sale',
      section_type: 'Hero',
      page_type: 'home',
      order: 0,
    });
  });

  it('hashes content and changes the hash when content changes', () => {
    const [a] = chunker.chunkPage(doc);
    const [b] = chunker.chunkPage({
      ...doc,
      page: {
        ...page,
        components: [
          { ...page.components[0], props: { title: 'Different' } },
          page.components[1],
        ],
      },
    });
    expect(a.content_hash).toHaveLength(64);
    expect(a.content_hash).not.toBe(b.content_hash);
  });

  it('falls back to componentId when no title prop and defaults tenant', () => {
    const [, feat] = chunker.chunkPage({ ...doc, tenant_id: null });
    expect(feat.section_name).toBe('FeaturedProducts');
    expect(feat.tenant_id).toBeNull();
    expect(feat.content).toContain('Tenant: default.');
  });
});
