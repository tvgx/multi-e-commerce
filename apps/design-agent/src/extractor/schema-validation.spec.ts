import {
  FigmaPageExtractionSchema,
  ShopPageLayoutSchema,
} from '@ecommerce/schema';

describe('ShopPageLayoutSchema (Claude extraction target)', () => {
  const validPage = {
    pageType: 'home',
    components: [
      {
        id: 'inst-1',
        componentId: 'Hero',
        type: 'section',
        order: 0,
        blocks: [{ id: 'inst-2', componentId: 'Heading' }],
      },
    ],
  };

  it('accepts a well-formed page layout (recursive blocks included)', () => {
    const parsed = ShopPageLayoutSchema.parse(validPage);
    expect(parsed.pageType).toBe('home');
    expect(parsed.components[0].blocks?.[0].componentId).toBe('Heading');
  });

  it('rejects an invalid pageType (triggers the retry path)', () => {
    expect(() =>
      ShopPageLayoutSchema.parse({ ...validPage, pageType: 'not_a_page' }),
    ).toThrow();
  });

  it('rejects a component missing componentId', () => {
    expect(() =>
      ShopPageLayoutSchema.parse({
        pageType: 'home',
        components: [{ id: 'x' }],
      }),
    ).toThrow();
  });
});

describe('FigmaPageExtractionSchema (metadata wrapper)', () => {
  const base = {
    figma_node_id: '1:23',
    figma_file_key: 'ABC123',
    figma_version: '987',
    name: 'Home',
    tenant_id: null,
    extracted_at: new Date().toISOString(),
    page: { pageType: 'home', components: [] },
  };

  it('accepts a complete extraction document', () => {
    const parsed = FigmaPageExtractionSchema.parse(base);
    expect(parsed.figma_node_id).toBe('1:23');
    expect(parsed.page.components).toEqual([]);
  });

  it('requires figma_node_id (the unique upsert key)', () => {
    const { figma_node_id, ...rest } = base;
    void figma_node_id;
    expect(() => FigmaPageExtractionSchema.parse(rest)).toThrow();
  });

  it('allows an omitted/nullable tenant_id', () => {
    const { tenant_id, ...rest } = base;
    void tenant_id;
    expect(() => FigmaPageExtractionSchema.parse(rest)).not.toThrow();
  });
});
