export type FieldType = 'text' | 'color' | 'image' | 'select' | 'textarea' | 'number' | 'boolean';

export interface FieldSchema {
  type: FieldType;
  id: string;
  label: string;
  default?: any;
  options?: { value: string; label: string }[]; // For select type
}

export interface ComponentSchema {
  id: string; // The componentId (e.g., 'Header', 'Hero')
  title: string; // Human-readable name
  type: 'section' | 'block';
  allowedBlocks?: string[]; // Array of componentIds of blocks that can be added to this section
  maxBlocks?: number;
  settings: FieldSchema[];
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
  { type: 'select', id: 'fontFamily', label: 'Font chữ', options: GOOGLE_FONTS, default: 'Inter' },
  { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#ffffff' },
  { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#000000' },
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
  allowedBlocks: ['HeaderMenuItem'],
  settings: [
    { type: 'image', id: 'logoUrl', label: 'Logo cửa hàng' },
    { type: 'select', id: 'logoPosition', label: 'Vị trí Logo', options: [
      { value: 'left', label: 'Bên trái' },
      { value: 'center', label: 'Ở giữa' }
    ], default: 'left' },
    { type: 'color', id: 'backgroundColor', label: 'Màu nền', default: '#ffffff' },
    { type: 'color', id: 'textColor', label: 'Màu chữ', default: '#000000' },
  ]
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

// --- Layered Slideshow ---
export const LayeredSlideshowSchema: ComponentSchema = {
  id: 'LayeredSlideshow',
  title: 'Layered Slideshow',
  type: 'section',
  allowedBlocks: ['SlideItem'],
  settings: [
    { type: 'color', id: 'backgroundColor', label: 'Màu nền khung', default: '#f8fafc' },
    { type: 'text', id: 'height', label: 'Chiều cao (CSS)', default: '80vh' }
  ]
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
  ]
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
// Registry Map
// ---------------------------------------------------------
export const ComponentSchemas: Record<string, ComponentSchema> = {
  Hero: HeroSchema,
  HeroBottomAligned: HeroBottomAlignedSchema,
  AnnouncementBar: AnnouncementBarSchema,
  Header: HeaderSchema,
  HeaderMenuItem: HeaderMenuItemSchema,
  LayeredSlideshow: LayeredSlideshowSchema,
  SlideItem: SlideItemSchema,
  Footer: FooterSchema,
  FooterColumn: FooterColumnSchema,
  // Add other schemas as needed... default fallback will be used if not found
};
