export type FieldType =
  | 'text' | 'color' | 'image' | 'select' | 'textarea' | 'number' | 'boolean' | 'font'
  // segmented: dãy nút chọn 1 (PropEditor render); product: picker sản phẩm thật của shop.
  | 'segmented' | 'product';

export interface FieldSchema {
  type: FieldType;
  id: string;
  label: string;
  default?: any;
  options?: { value: string; label: string }[] | string[]; // For select/segmented type
  min?: number;
  max?: number;
  step?: number;
}

export interface DefaultBlock {
  componentId: string;
  props?: Record<string, any>;
}

export interface ComponentSchema {
  id: string; // The componentId (e.g., 'Header', 'Hero')
  title: string; // Human-readable name
  type: 'section' | 'block';
  allowedBlocks?: string[]; // Array of componentIds of blocks that can be added to this section
  maxBlocks?: number;
  settings: FieldSchema[];
  defaultBlocks?: DefaultBlock[]; // Blocks auto-created when this section is added
  previewImages?: string[];       // Static preview image paths
  category?: string;              // UI category label
}

// ---------------------------------------------------------
// Global Configs
// ---------------------------------------------------------

export const GOOGLE_FONTS = [
  "Inter", "Roboto", "Playfair Display", "Lora", "Montserrat", 
  "Oswald", "Raleway", "Nunito", "Poppins", "Source Sans 3"
].map(f => ({ value: f, label: f }));

// ---------------------------------------------------------
// Common Schema Pieces
// ---------------------------------------------------------

const commonTextSettings: FieldSchema[] = [
  { type: 'text', id: 'title', label: 'Tiêu đề chính' },
  { type: 'textarea', id: 'subtitle', label: 'Phụ đề' },
  { type: 'text', id: 'ctaText', label: 'Nút bấm (Text)' },
  { type: 'text', id: 'ctaLink', label: 'Nút bấm (Link)' },
];

const commonStyleSettings: FieldSchema[] = [
  { type: 'image', id: 'backgroundImageUrl', label: 'Ảnh nền / Ảnh chính' },
  { type: 'font', id: 'fontFamily', label: 'Font chữ', default: 'Inter' },
  { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#ffffff' },
  { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#000000' },
];

// Tùy chỉnh sâu cho section hiển thị sản phẩm: số lượng, mật độ đệm, cỡ tiêu đề.
const productSectionSettings: FieldSchema[] = [
  { type: 'number', id: 'maxItems', label: 'Số sản phẩm hiển thị', default: 8, min: 1, max: 24, step: 1 },
  {
    type: 'segmented', id: 'paddingY', label: 'Khoảng đệm dọc', default: 'normal',
    options: [
      { value: 'compact', label: 'Gọn' },
      { value: 'normal', label: 'Vừa' },
      { value: 'spacious', label: 'Rộng' },
    ],
  },
  {
    type: 'segmented', id: 'headingSize', label: 'Cỡ tiêu đề', default: 'md',
    options: [
      { value: 'sm', label: 'Nhỏ' },
      { value: 'md', label: 'Vừa' },
      { value: 'lg', label: 'Lớn' },
    ],
  },
];

// ---------------------------------------------------------
// Sections
// ---------------------------------------------------------

export const HeroSchema: ComponentSchema = {
  id: 'Hero',
  title: 'Banner Hero (Đơn giản)',
  type: 'section',
  settings: [
    ...commonTextSettings,
    ...commonStyleSettings,
  ],
};

export const HeroBottomAlignedSchema: ComponentSchema = {
  id: 'HeroBottomAligned',
  title: 'Banner Hero (Căn dưới)',
  type: 'section',
  settings: [
    ...commonTextSettings,
    ...commonStyleSettings,
  ],
};

export const AnnouncementBarSchema: ComponentSchema = {
  id: 'AnnouncementBar',
  title: 'Thanh thông báo',
  type: 'section',
  settings: [
    { type: 'text', id: 'text', label: 'Nội dung thông báo' },
    { type: 'text', id: 'link', label: 'Đường dẫn' },
    { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#000000' },
    { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#ffffff' },
  ]
};

// --- Header ---
export const HeaderSchema: ComponentSchema = {
  id: 'Header',
  title: 'Header (Thanh điều hướng)',
  type: 'section',
  allowedBlocks: ['HeaderMenuItem', 'HeaderLanguageSwitcher', 'HeaderCartTrigger'],
  settings: [
    { type: 'image', id: 'logoUrl', label: 'Logo cửa hàng' },
    { type: 'select', id: 'logoPosition', label: 'Vị trí Logo', options: [
      { value: 'left', label: 'Bên trái' },
      { value: 'center', label: 'Ở giữa' }
    ], default: 'left' },
    { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#ffffff' },
    { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#000000' },
  ],
  defaultBlocks: [
    { componentId: 'HeaderMenuItem', props: { label: 'Trang chủ', link: '/' } },
    { componentId: 'HeaderMenuItem', props: { label: 'Sản phẩm', link: '/products' } },
    { componentId: 'HeaderLanguageSwitcher', props: {} },
    { componentId: 'HeaderCartTrigger', props: {} },
  ],
};

export const HeaderMenuItemSchema: ComponentSchema = {
  id: 'HeaderMenuItem',
  title: 'Menu Item',
  type: 'block',
  settings: [
    { type: 'text', id: 'label', label: 'Tên menu', default: 'Trang chủ' },
    { type: 'text', id: 'link', label: 'Đường dẫn', default: '/' }
  ]
};

export const HeaderLanguageSwitcherSchema: ComponentSchema = {
  id: 'HeaderLanguageSwitcher',
  title: 'Chuyển đổi ngôn ngữ',
  type: 'block',
  settings: []
};

export const HeaderCartTriggerSchema: ComponentSchema = {
  id: 'HeaderCartTrigger',
  title: 'Giỏ hàng',
  type: 'block',
  settings: []
};

// --- Layered Slideshow ---
export const LayeredSlideshowSchema: ComponentSchema = {
  id: 'LayeredSlideshow',
  title: 'Layered Slideshow',
  type: 'section',
  allowedBlocks: ['SlideItem'],
  settings: [
    { type: 'color', id: 'backgroundColor', label: 'Màu nền khung', default: '#f8fafc' },
    { type: 'text', id: 'height', label: 'Chiều cao (CSS)', default: '80vh' }
  ],
  defaultBlocks: [
    { componentId: 'SlideItem', props: { title: 'Slide 1', subtitle: 'Mô tả slide đầu tiên', ctaText: 'Khám phá ngay', textColor: '#ffffff', overlayColor: '#000000', overlayOpacity: 0.4 } },
    { componentId: 'SlideItem', props: { title: 'Slide 2', subtitle: 'Mô tả slide thứ hai', ctaText: 'Mua ngay', textColor: '#ffffff', overlayColor: '#000000', overlayOpacity: 0.4 } },
  ],
};

export const SlideItemSchema: ComponentSchema = {
  id: 'SlideItem',
  title: 'Slide Ảnh',
  type: 'block',
  settings: [
    { type: 'image', id: 'backgroundImageUrl', label: 'Hình ảnh Slide' },
    ...commonTextSettings,
    { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#ffffff' },
    { type: 'color', id: 'overlayColor', label: 'Màu phủ (Overlay)', default: '#000000' },
    { type: 'number', id: 'overlayOpacity', label: 'Độ mờ phủ (0-1)', default: 0.4 },
  ]
};

// --- Footer ---
export const FooterSchema: ComponentSchema = {
  id: 'Footer',
  title: 'Footer',
  type: 'section',
  allowedBlocks: ['FooterColumn'],
  settings: [
    { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#111827' },
    { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#ffffff' },
    { type: 'text', id: 'copyrightText', label: 'Dòng bản quyền', default: '© 2026 E-commerce' }
  ],
  defaultBlocks: [
    { componentId: 'FooterColumn', props: { title: 'Về chúng tôi', links: 'Giới thiệu,/about\nLiên hệ,/contact' } },
    { componentId: 'FooterColumn', props: { title: 'Hỗ trợ', links: 'Chính sách,/policy\nĐổi trả,/returns' } },
  ],
};

export const FooterColumnSchema: ComponentSchema = {
  id: 'FooterColumn',
  title: 'Cột Footer',
  type: 'block',
  settings: [
    { type: 'text', id: 'title', label: 'Tiêu đề cột' },
    { type: 'textarea', id: 'links', label: 'Các liên kết (Mỗi dòng 1 liên kết: Tên,URL)' }
  ]
};


// ---------------------------------------------------------
// Collections
// ---------------------------------------------------------
export const CollectionLinksSpotlightSchema: ComponentSchema = {
  id: 'CollectionLinksSpotlight', title: 'Danh mục (Spotlight)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const CollectionLinksTextSchema: ComponentSchema = {
  id: 'CollectionLinksText', title: 'Danh mục (Text list)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const CollectionListsBentoSchema: ComponentSchema = {
  id: 'CollectionListsBento', title: 'Danh mục (Bento Grid)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const CollectionListsCarouselSchema: ComponentSchema = {
  id: 'CollectionListsCarousel', title: 'Danh mục (Carousel)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const CollectionListsEditorialSchema: ComponentSchema = {
  id: 'CollectionListsEditorial', title: 'Danh mục (Editorial)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const CollectionListsGridSchema: ComponentSchema = {
  id: 'CollectionListsGrid', title: 'Danh mục (Grid)', type: 'section',
  settings: [ { type: 'number', id: 'columns', label: 'Số cột', default: 4 }, ...commonTextSettings, ...commonStyleSettings ]
};

// ---------------------------------------------------------
// Products
// ---------------------------------------------------------
export const FeaturedCollectionCarouselSchema: ComponentSchema = {
  id: 'FeaturedCollectionCarousel', title: 'Sản phẩm nổi bật (Carousel)', type: 'section',
  settings: [ ...commonTextSettings, ...productSectionSettings, ...commonStyleSettings ]
};
export const FeaturedCollectionEditorialSchema: ComponentSchema = {
  id: 'FeaturedCollectionEditorial', title: 'Sản phẩm nổi bật (Editorial)', type: 'section',
  settings: [ ...commonTextSettings, ...productSectionSettings, ...commonStyleSettings ]
};
export const FeaturedCollectionGridSchema: ComponentSchema = {
  id: 'FeaturedCollectionGrid', title: 'Sản phẩm nổi bật (Grid)', type: 'section',
  settings: [
    { type: 'number', id: 'columns', label: 'Số cột', default: 4, min: 2, max: 4, step: 1 },
    { type: 'text', id: 'viewAllText', label: 'Nút xem tất cả (Text)', default: 'View All' },
    { type: 'text', id: 'viewAllLink', label: 'Nút xem tất cả (Link)' },
    ...commonTextSettings, ...productSectionSettings, ...commonStyleSettings,
  ]
};
// --- Product card blocks (Phase B) ---
// Thẻ sản phẩm trong FeaturedProducts/RecommendedProducts được ghép từ các
// block con — bật/tắt (isHidden), đổi thứ tự, chỉnh props từng phần.
export const ProductCardImageSchema: ComponentSchema = {
  id: 'ProductCardImage', title: 'Ảnh sản phẩm', type: 'block',
  settings: [
    {
      type: 'select', id: 'fit', label: 'Kiểu hiển thị', default: 'cover',
      options: [
        { value: 'cover', label: 'Phủ kín (cover)' },
        { value: 'contain', label: 'Vừa khung (contain)' },
      ],
    },
  ]
};
export const ProductCardNameSchema: ComponentSchema = {
  id: 'ProductCardName', title: 'Tên sản phẩm', type: 'block',
  settings: []
};
export const ProductCardPriceSchema: ComponentSchema = {
  id: 'ProductCardPrice', title: 'Giá', type: 'block',
  settings: []
};
export const ProductCardButtonSchema: ComponentSchema = {
  id: 'ProductCardButton', title: 'Nút mua', type: 'block',
  settings: [
    { type: 'text', id: 'label', label: 'Nhãn nút', default: 'Thêm vào giỏ' },
  ]
};
export const ProductCardRatingSchema: ComponentSchema = {
  id: 'ProductCardRating', title: 'Đánh giá (badge)', type: 'block',
  settings: [
    { type: 'text', id: 'label', label: 'Nội dung badge', default: '★ Top Rated' },
  ]
};

const PRODUCT_CARD_BLOCK_IDS = [
  'ProductCardImage', 'ProductCardName', 'ProductCardPrice', 'ProductCardButton', 'ProductCardRating',
];
const PRODUCT_CARD_DEFAULT_BLOCKS: DefaultBlock[] = [
  { componentId: 'ProductCardImage', props: {} },
  { componentId: 'ProductCardName', props: {} },
  { componentId: 'ProductCardPrice', props: {} },
  { componentId: 'ProductCardButton', props: { label: 'Thêm vào giỏ' } },
];

export const FeaturedProductsSchema: ComponentSchema = {
  id: 'FeaturedProducts', title: 'Sản phẩm nổi bật', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ],
  allowedBlocks: PRODUCT_CARD_BLOCK_IDS,
  defaultBlocks: [...PRODUCT_CARD_DEFAULT_BLOCKS, { componentId: 'ProductCardRating', props: { label: '★ Top Rated' } }],
};
export const ProductHighlightSchema: ComponentSchema = {
  id: 'ProductHighlight', title: 'Highlight Sản phẩm', type: 'section',
  settings: [ { type: 'text', id: 'productId', label: 'ID Sản phẩm' }, ...commonTextSettings, ...commonStyleSettings ]
};
export const ProductHotspotSchema: ComponentSchema = {
  id: 'ProductHotspot', title: 'Hotspot Sản phẩm', type: 'section',
  settings: [ { type: 'image', id: 'backgroundImageUrl', label: 'Ảnh chính' }, ...commonTextSettings ]
};
export const RecommendedProductsSchema: ComponentSchema = {
  id: 'RecommendedProducts', title: 'Sản phẩm gợi ý', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ],
  allowedBlocks: PRODUCT_CARD_BLOCK_IDS,
  defaultBlocks: PRODUCT_CARD_DEFAULT_BLOCKS,
};
export const FiltersSidebarSchema: ComponentSchema = {
  id: 'FiltersSidebar', title: 'Bộ lọc (Sidebar)', type: 'section',
  settings: [ { type: 'text', id: 'title', label: 'Tiêu đề bộ lọc', default: 'Lọc sản phẩm' }, { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#ffffff' } ]
};
export const SearchBarSchema: ComponentSchema = {
  id: 'SearchBar', title: 'Thanh tìm kiếm', type: 'block',
  settings: [ { type: 'text', id: 'placeholder', label: 'Placeholder', default: 'Tìm kiếm...' } ]
};

// ---------------------------------------------------------
// Storytelling
// ---------------------------------------------------------
export const BlogPostCarouselSchema: ComponentSchema = {
  id: 'BlogPostCarousel', title: 'Bài viết (Carousel)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const BlogPostEditorialSchema: ComponentSchema = {
  id: 'BlogPostEditorial', title: 'Bài viết (Editorial)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const BlogPostGridSchema: ComponentSchema = {
  id: 'BlogPostGrid', title: 'Bài viết (Grid)', type: 'section',
  settings: [ { type: 'number', id: 'columns', label: 'Số cột', default: 3 }, ...commonTextSettings, ...commonStyleSettings ]
};
export const CarouselSchema: ComponentSchema = {
  id: 'Carousel', title: 'Carousel Cơ bản', type: 'section',
  allowedBlocks: ['SlideItem'],
  settings: [ ...commonTextSettings, ...commonStyleSettings ],
  defaultBlocks: [
    { componentId: 'SlideItem', props: { title: 'Slide 1', ctaText: 'Xem thêm', textColor: '#ffffff', overlayOpacity: 0.4 } },
    { componentId: 'SlideItem', props: { title: 'Slide 2', ctaText: 'Xem thêm', textColor: '#ffffff', overlayOpacity: 0.4 } },
  ],
};
export const EditorialSchema: ComponentSchema = {
  id: 'Editorial', title: 'Editorial', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const EditorialJumboTextSchema: ComponentSchema = {
  id: 'EditorialJumboText', title: 'Editorial (Chữ lớn)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const ImageCompareSchema: ComponentSchema = {
  id: 'ImageCompare', title: 'So sánh ảnh (Trước/Sau)', type: 'section',
  settings: [ { type: 'image', id: 'imageBefore', label: 'Ảnh Trước' }, { type: 'image', id: 'imageAfter', label: 'Ảnh Sau' }, ...commonTextSettings ]
};
export const ImageWithTextSchema: ComponentSchema = {
  id: 'ImageWithText', title: 'Ảnh kèm Chữ', type: 'section',
  settings: [ { type: 'select', id: 'layout', label: 'Bố cục', options: [{value: 'image_first', label: 'Ảnh bên trái'}, {value: 'text_first', label: 'Ảnh bên phải'}], default: 'image_first' }, ...commonTextSettings, ...commonStyleSettings ]
};

// ---------------------------------------------------------
// Text
// ---------------------------------------------------------
export const FAQSchema: ComponentSchema = {
  id: 'FAQ', title: 'Hỏi đáp (FAQ)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};

export const IconsWithTextSchema: ComponentSchema = {
  id: 'IconsWithText', title: 'Icon kèm Chữ', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const MarqueeSchema: ComponentSchema = {
  id: 'Marquee', title: 'Chữ chạy (Marquee)', type: 'section',
  settings: [ { type: 'text', id: 'text', label: 'Nội dung chữ chạy' }, { type: 'number', id: 'speed', label: 'Tốc độ', default: 20 }, ...commonStyleSettings ]
};
export const MulticolumnSchema: ComponentSchema = {
  id: 'Multicolumn', title: 'Nhiều cột', type: 'section',
  settings: [ { type: 'number', id: 'columns', label: 'Số cột', default: 3 }, ...commonTextSettings, ...commonStyleSettings ]
};
export const PullQuoteSchema: ComponentSchema = {
  id: 'PullQuote', title: 'Trích dẫn', type: 'section',
  settings: [ { type: 'textarea', id: 'quote', label: 'Nội dung trích dẫn' }, { type: 'text', id: 'author', label: 'Tác giả' }, ...commonStyleSettings ]
};
export const RichTextSchema: ComponentSchema = {
  id: 'RichText', title: 'Đoạn văn bản', type: 'section',
  settings: [ ...commonTextSettings, { type: 'select', id: 'alignment', label: 'Căn lề', options: [{value: 'left', label: 'Trái'}, {value: 'center', label: 'Giữa'}, {value: 'right', label: 'Phải'}], default: 'center' }, ...commonStyleSettings ]
};

// ---------------------------------------------------------
// Banners
// ---------------------------------------------------------
export const HeroMarqueeSchema: ComponentSchema = {
  id: 'HeroMarquee', title: 'Banner Hero (Chữ chạy)', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};
export const LargeLogoSchema: ComponentSchema = {
  id: 'LargeLogo', title: 'Logo lớn', type: 'section',
  settings: [ { type: 'image', id: 'logoUrl', label: 'Logo' }, ...commonStyleSettings ]
};
export const SlideshowFullFrameSchema: ComponentSchema = {
  id: 'SlideshowFullFrame',
  title: 'Slideshow Toàn màn hình',
  type: 'section',
  allowedBlocks: ['SlideItem'],
  settings: [
    { type: 'color', id: 'backgroundColor', label: 'Màu nền khung', default: '#000000' },
    { type: 'text', id: 'height', label: 'Chiều cao (CSS)', default: '100vh' },
  ],
  defaultBlocks: [
    { componentId: 'SlideItem', props: { title: 'Bộ sưu tập mùa xuân', subtitle: 'Màu sắc tươi sáng cho mùa mới', ctaText: 'Khám phá ngay', ctaLink: '#', textColor: '#ffffff', overlayColor: '#000000', overlayOpacity: 0.3 } },
    { componentId: 'SlideItem', props: { title: 'Phong cách hè rực rỡ', subtitle: 'Thoải mái và năng động mỗi ngày', ctaText: 'Mua ngay', ctaLink: '#', textColor: '#ffffff', overlayColor: '#000000', overlayOpacity: 0.3 } },
    { componentId: 'SlideItem', props: { title: 'Hàng mới về', subtitle: 'Những sản phẩm mới nhất vừa cập bến', ctaText: 'Xem thêm', ctaLink: '#', textColor: '#ffffff', overlayColor: '#000000', overlayOpacity: 0.3 } },
  ],
};
export const SlideshowInsetSchema: ComponentSchema = {
  id: 'SlideshowInset',
  title: 'Slideshow Thu nhỏ',
  type: 'section',
  allowedBlocks: ['SlideItem'],
  settings: [
    { type: 'color', id: 'backgroundColor', label: 'Màu nền khung', default: '#f8fafc' },
  ],
  defaultBlocks: [
    { componentId: 'SlideItem', props: { title: 'Nike Air Max', subtitle: 'Đệm khí êm ái cho mọi hành trình', ctaText: '$129.00', ctaLink: '#', textColor: '#0f172a', overlayColor: '#000000', overlayOpacity: 0 } },
    { componentId: 'SlideItem', props: { title: 'Adidas Ultra Boost', subtitle: 'Năng lượng phản hồi cho mỗi bước chạy', ctaText: '$149.00', ctaLink: '#', textColor: '#0f172a', overlayColor: '#000000', overlayOpacity: 0 } },
  ],
};
export const SplitShowcaseSchema: ComponentSchema = {
  id: 'SplitShowcase', title: 'Showcase Chia đôi', type: 'section',
  settings: [ ...commonTextSettings, ...commonStyleSettings ]
};

// ---------------------------------------------------------
// Page-level "mega" sections (product listing / product detail)
// These render real shop data; only the framing copy is editable.
// ---------------------------------------------------------
export const StandardCategoryPageSchema: ComponentSchema = {
  id: 'StandardCategoryPage',
  title: 'Danh sách sản phẩm',
  type: 'section',
  category: 'Trang sản phẩm',
  settings: [
    { type: 'text', id: 'title', label: 'Tiêu đề trang', default: 'Tất cả sản phẩm' },
    { type: 'textarea', id: 'description', label: 'Mô tả ngắn', default: 'Khám phá toàn bộ bộ sưu tập của chúng tôi.' },
  ],
};

export const StandardProductDetailSchema: ComponentSchema = {
  id: 'StandardProductDetail',
  title: 'Chi tiết sản phẩm',
  type: 'section',
  category: 'Trang sản phẩm',
  // Content is driven by the selected product; no free-form fields to edit.
  settings: [],
};

// ---------------------------------------------------------
// Registry Map
// ---------------------------------------------------------
export const ComponentSchemas: Record<string, ComponentSchema> = {
  StandardCategoryPage: StandardCategoryPageSchema,
  StandardProductDetail: StandardProductDetailSchema,
  Hero: HeroSchema,
  HeroBottomAligned: HeroBottomAlignedSchema,
  AnnouncementBar: AnnouncementBarSchema,
  Header: HeaderSchema,
  HeaderMenuItem: HeaderMenuItemSchema,
  HeaderLanguageSwitcher: HeaderLanguageSwitcherSchema,
  HeaderCartTrigger: HeaderCartTriggerSchema,
  LayeredSlideshow: LayeredSlideshowSchema,
  SlideItem: SlideItemSchema,
  Footer: FooterSchema,
  FooterColumn: FooterColumnSchema,

  // Collections
  CollectionLinksSpotlight: CollectionLinksSpotlightSchema,
  CollectionLinksText: CollectionLinksTextSchema,
  CollectionListsBento: CollectionListsBentoSchema,
  CollectionListsCarousel: CollectionListsCarouselSchema,
  CollectionListsEditorial: CollectionListsEditorialSchema,
  CollectionListsGrid: CollectionListsGridSchema,

  // Products
  FeaturedCollectionCarousel: FeaturedCollectionCarouselSchema,
  FeaturedCollectionEditorial: FeaturedCollectionEditorialSchema,
  FeaturedCollectionGrid: FeaturedCollectionGridSchema,
  FeaturedProducts: FeaturedProductsSchema,
  ProductHighlight: ProductHighlightSchema,
  ProductHotspot: ProductHotspotSchema,
  RecommendedProducts: RecommendedProductsSchema,
  FiltersSidebar: FiltersSidebarSchema,
  SearchBar: SearchBarSchema,
  // Product card blocks (con của FeaturedProducts/RecommendedProducts)
  ProductCardImage: ProductCardImageSchema,
  ProductCardName: ProductCardNameSchema,
  ProductCardPrice: ProductCardPriceSchema,
  ProductCardButton: ProductCardButtonSchema,
  ProductCardRating: ProductCardRatingSchema,

  // Storytelling
  BlogPostCarousel: BlogPostCarouselSchema,
  BlogPostEditorial: BlogPostEditorialSchema,
  BlogPostGrid: BlogPostGridSchema,
  Carousel: CarouselSchema,
  Editorial: EditorialSchema,
  EditorialJumboText: EditorialJumboTextSchema,
  ImageCompare: ImageCompareSchema,
  ImageWithText: ImageWithTextSchema,

  // Text
  FAQ: FAQSchema,
  IconsWithText: IconsWithTextSchema,
  Marquee: MarqueeSchema,
  Multicolumn: MulticolumnSchema,
  PullQuote: PullQuoteSchema,
  RichText: RichTextSchema,

  // Banners
  HeroMarquee: HeroMarqueeSchema,
  LargeLogo: LargeLogoSchema,
  SlideshowFullFrame: SlideshowFullFrameSchema,
  SlideshowInset: SlideshowInsetSchema,
  SplitShowcase: SplitShowcaseSchema,
};
