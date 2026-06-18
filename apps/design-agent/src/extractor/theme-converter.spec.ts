import {
  convertExtractionsToTheme,
  firstImageUrl,
  firstImageUrlInComponents,
  slugify,
  ShopPageLayout,
  UIComponentRef,
} from '@ecommerce/schema';

describe('convertExtractionsToTheme', () => {
  const pages: ShopPageLayout[] = [
    {
      pageType: 'home',
      components: [
        { id: 'h', componentId: 'Header', type: 'section', order: 0 },
        {
          id: 'hero',
          componentId: 'Hero',
          type: 'section',
          order: 1,
          props: { title: 'Hi', backgroundColor: '#112233', fontFamily: 'Lora' },
        },
        { id: 'f', componentId: 'Footer', type: 'section', order: 2 },
      ],
    },
    {
      pageType: 'product_listing',
      components: [
        // Duplicate Header should be deduped out of the page.
        { id: 'h2', componentId: 'Header', type: 'section', order: 0 },
        { id: 'cat', componentId: 'StandardCategoryPage', type: 'section', order: 1 },
      ],
    },
  ];

  it('hoists global components and reindexes page order', () => {
    const { global, pages: out } = convertExtractionsToTheme(pages);

    expect(global.globalComponents.map((c) => c.componentId)).toEqual([
      'Header',
      'Footer',
    ]);
    // Stable builder ids assigned to singleton globals.
    expect(global.globalComponents[0].id).toBe('global-header');
    expect(global.globalComponents[1].id).toBe('global-footer');

    // Page only keeps non-global sections, re-indexed from 0.
    expect(out.home.map((c) => c.componentId)).toEqual(['Hero']);
    expect(out.home[0].order).toBe(0);
    expect(out.product_listing.map((c) => c.componentId)).toEqual([
      'StandardCategoryPage',
    ]);
    expect(out.product_listing[0].order).toBe(0);
  });

  it('infers theme font and colour from props', () => {
    const { global } = convertExtractionsToTheme(pages);
    expect(global.theme.fontFamily).toBe('Lora');
    expect(global.theme.primaryColor).toBe('#112233');
  });
});

describe('firstImageUrl helpers', () => {
  it('finds the first http image-prop URL across components (incl. blocks)', () => {
    const components: UIComponentRef[] = [
      { id: 'a', componentId: 'RichText', type: 'section', order: 0, props: {} },
      {
        id: 'b',
        componentId: 'Hero',
        type: 'section',
        order: 1,
        blocks: [
          {
            id: 'b1',
            componentId: 'Media',
            type: 'block',
            order: 0,
            props: { url: 'https://cdn.example.com/x.png' },
          },
        ],
      },
    ];
    expect(firstImageUrlInComponents(components)).toBe(
      'https://cdn.example.com/x.png',
    );
    expect(firstImageUrlInComponents([])).toBeUndefined();
  });

  it('scans pages via firstImageUrl', () => {
    const pages: ShopPageLayout[] = [
      {
        pageType: 'home',
        components: [
          {
            id: 'hero',
            componentId: 'Hero',
            type: 'section',
            order: 0,
            props: { backgroundImageUrl: 'https://cdn/img.jpg' },
          },
        ],
      },
    ];
    expect(firstImageUrl(pages)).toBe('https://cdn/img.jpg');
  });
});

describe('slugify', () => {
  it('lowercases, folds Vietnamese diacritics, and hyphenates', () => {
    expect(slugify('Thời trang Mùa Hè')).toBe('thoi-trang-mua-he');
    expect(slugify('Đồ điện tử')).toBe('do-dien-tu');
    expect(slugify('  Multi   Space!! ')).toBe('multi-space');
    expect(slugify('')).toBe('theme');
  });
});
