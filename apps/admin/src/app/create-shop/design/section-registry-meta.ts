export interface SectionMeta {
  componentId: string;
  label: string;
  icon: string;
  desc: string;
  previewImage?: string;
  pages?: string[]; // if set, only offered on these page types
}

export const SECTION_CATEGORIES: { label: string; sections: SectionMeta[] }[] = [
  {
    label: 'Trang sản phẩm',
    sections: [
      { componentId: 'StandardCategoryPage', label: 'Danh sách sản phẩm', icon: 'grid', desc: 'Lưới sản phẩm kèm bộ lọc cho trang danh mục.', pages: ['product_listing'] },
      { componentId: 'StandardProductDetail', label: 'Chi tiết sản phẩm', icon: 'layout', desc: 'Bố cục chi tiết một sản phẩm.', pages: ['product_detail'] },
    ]
  },
  {
    label: 'Banners',
    sections: [
      { componentId: 'Hero', label: 'Image Banner', icon: 'image', desc: 'Banner lớn với tiêu đề và nút CTA.', previewImage: '/section-previews/banners/hero/media__1780241741556.png' },
      { componentId: 'HeroBottomAligned', label: 'Hero: Căn dưới', icon: 'image', desc: 'Hero với nội dung căn dưới.', previewImage: '/section-previews/banners/header_bottom_aligned/media__1780242455808.png' },
      { componentId: 'HeroMarquee', label: 'Hero: Chữ chạy', icon: 'image', desc: 'Hero kết hợp marquee cuộn.', previewImage: '/section-previews/banners/hero_marquee/media__1780242500657.png' },
      { componentId: 'LargeLogo', label: 'Logo lớn', icon: 'type', desc: 'Hiển thị logo nổi bật.', previewImage: '/section-previews/banners/large_logo/media__1780242605027.png' },
      { componentId: 'LayeredSlideshow', label: 'Slideshow xếp lớp', icon: 'layers', desc: 'Slideshow nhiều lớp chồng nhau.', previewImage: '/section-previews/banners/layered_slideshow/media__1780242704303.png' },
      { componentId: 'SlideshowFullFrame', label: 'Slideshow toàn màn hình', icon: 'monitor', desc: 'Slideshow tràn viền.', previewImage: '/section-previews/banners/slideshow_full_frame/media__1780243337620.png' },
      { componentId: 'SlideshowInset', label: 'Slideshow thu nhỏ', icon: 'layout', desc: 'Slideshow có padding xung quanh.', previewImage: '/section-previews/banners/slideshow_inset/media__1780243401235.png' },
      { componentId: 'SplitShowcase', label: 'Showcase chia đôi', icon: 'columns', desc: 'Bố cục 2 cột ảnh và chữ.', previewImage: '/section-previews/banners/spilt_showcase/media__1780243767084.png' },
    ]
  },
  {
    label: 'Collections',
    sections: [
      { componentId: 'CollectionLinksSpotlight', label: 'Danh mục: Spotlight', icon: 'spotlight', desc: 'Nổi bật liên kết bộ sưu tập.', previewImage: '/section-previews/collections/spotlight/media__1780243921637.png' },
      { componentId: 'CollectionLinksText', label: 'Danh mục: Text', icon: 'type', desc: 'Liên kết dạng văn bản.', previewImage: '/section-previews/collections/collection_links_text/media__1780243988798.png' },
      { componentId: 'CollectionListsBento', label: 'Danh mục: Bento Grid', icon: 'grid', desc: 'Lưới bento cho bộ sưu tập.', previewImage: '/section-previews/collections/collection_list_bento/media__1780244009660.png' },
      { componentId: 'CollectionListsCarousel', label: 'Danh mục: Carousel', icon: 'slider', desc: 'Carousel bộ sưu tập.', previewImage: '/section-previews/collections/collection_list_carousel/media__1780244076381.png' },
      { componentId: 'CollectionListsEditorial', label: 'Danh mục: Editorial', icon: 'book', desc: 'Phong cách editorial.', previewImage: '/section-previews/collections/collection_list_editorial/media__1780244182514.png' },
      { componentId: 'CollectionListsGrid', label: 'Danh mục: Grid', icon: 'grid', desc: 'Lưới chuẩn.', previewImage: '/section-previews/collections/collection_list_grid/media__1780244223854.png' },
    ]
  },
  {
    label: 'Products',
    sections: [
      { componentId: 'FeaturedCollection', label: 'Featured Collection', icon: 'layout', desc: 'Lưới sản phẩm được chọn.', previewImage: '/section-previews/banners/featured_collection/media__1780242002847.png' },
      { componentId: 'FeaturedCollectionCarousel', label: 'Featured Collection Carousel', icon: 'slider', desc: 'Carousel sản phẩm nổi bật.', previewImage: '/section-previews/collections/featured_collection_carousel/media__1780244610965.png' },
      { componentId: 'FeaturedCollectionEditorial', label: 'Featured Collection Editorial', icon: 'book', desc: 'Editorial sản phẩm nổi bật.', previewImage: '/section-previews/collections/featured_collection_editorial/media__1780244720003.png' },
      { componentId: 'FeaturedCollectionGrid', label: 'Featured Collection Grid', icon: 'grid', desc: 'Lưới sản phẩm nổi bật.', previewImage: '/section-previews/collections/featured_collection_grid/media__1780244766344.png' },
      { componentId: 'FeaturedProducts', label: 'Sản phẩm nổi bật', icon: 'star', desc: 'Highlight sản phẩm cụ thể.', previewImage: '/section-previews/products/featured_product/media__1780244789282.png' },
      { componentId: 'ProductHighlight', label: 'Product Highlight', icon: 'star', desc: 'Nổi bật 1 sản phẩm.', previewImage: '/section-previews/products/product_highlight/media__1780244827534.png' },
      { componentId: 'ProductHotspot', label: 'Product Hotspot', icon: 'target', desc: 'Ảnh với điểm tương tác sản phẩm.', previewImage: '/section-previews/products/product_hotspot/media__1780244931591.png' },
      { componentId: 'RecommendedProducts', label: 'Sản phẩm gợi ý', icon: 'thumbs-up', desc: 'Danh sách sản phẩm gợi ý.', previewImage: '/section-previews/products/recommended_products/media__1780244951786.png' },
    ]
  },
  {
    label: 'Storytelling',
    sections: [
      { componentId: 'BlogPostCarousel', label: 'Bài viết (Carousel)', icon: 'slider', desc: 'Carousel bài viết blog.' },
      { componentId: 'BlogPostEditorial', label: 'Bài viết (Editorial)', icon: 'book', desc: 'Bố cục editorial bài viết.' },
      { componentId: 'BlogPostGrid', label: 'Bài viết (Grid)', icon: 'grid', desc: 'Lưới bài viết.' },
      { componentId: 'Carousel', label: 'Carousel Cơ bản', icon: 'slider', desc: 'Carousel nội dung tổng quát.' },
      { componentId: 'Editorial', label: 'Editorial', icon: 'book', desc: 'Nội dung phong cách editorial.' },
      { componentId: 'EditorialJumboText', label: 'Editorial (Chữ lớn)', icon: 'type', desc: 'Editorial với chữ jumbo.' },
      { componentId: 'ImageCompare', label: 'So sánh ảnh (Trước/Sau)', icon: 'columns', desc: 'Slider so sánh trước/sau.' },
      { componentId: 'ImageWithText', label: 'Ảnh kèm Chữ', icon: 'layout', desc: 'Ảnh bên cạnh khối văn bản.' },
    ]
  },
  {
    label: 'Text',
    sections: [
      { componentId: 'FAQ', label: 'Hỏi đáp (FAQ)', icon: 'help-circle', desc: 'Accordion câu hỏi thường gặp.' },
      { componentId: 'IconsWithText', label: 'Icon kèm Chữ', icon: 'star', desc: 'Hàng icon + nhãn văn bản.' },
      { componentId: 'Marquee', label: 'Chữ chạy (Marquee)', icon: 'type', desc: 'Văn bản cuộn ngang.' },
      { componentId: 'Multicolumn', label: 'Nhiều cột', icon: 'columns', desc: 'Nhiều cột văn bản.' },
      { componentId: 'PullQuote', label: 'Trích dẫn', icon: 'message-square', desc: 'Nổi bật câu trích dẫn.' },
      { componentId: 'RichText', label: 'Đoạn văn bản', icon: 'type', desc: 'Khối văn bản chuẩn.' },
      { componentId: 'AnnouncementBar', label: 'Thanh thông báo', icon: 'megaphone', desc: 'Dải thông báo mỏng ở trên cùng.' },
    ]
  }
];
