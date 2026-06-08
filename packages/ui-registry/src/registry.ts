import { AddSectionDropdown } from './components/builder/add-section-dropdown';
import { CanvasRenderer } from './components/builder/canvas-renderer';
import { PropertiesEditor } from './components/builder/properties-editor';
import { SidebarSections } from './components/builder/sidebar-sections';
import { AddToCartButton } from './components/cart/AddToCartButton';
import { CartInitializer } from './components/cart/CartInitializer';
import { CartSidebar } from './components/cart/CartSidebar';
import { CartTrigger } from './components/cart/CartTrigger';
import { CookieConsent } from './components/cookie-consent';
import { Footer, footerSchema } from './components/footer';
import { Header, headerSchema } from './components/sections/header/Header';
import { AnnouncementBar, announcementBarSchema } from './components/sections/header/AnnouncementBar';
import { HeroBottomAligned, heroBottomAlignedSchema } from './components/sections/banners/HeroBottomAligned';
import { HeroMarquee } from './components/sections/banners/HeroMarquee';
import { Hero, heroSchema } from './components/sections/banners/Hero';
import { LargeLogo } from './components/sections/banners/LargeLogo';
import { ProductCard } from './components/product-card';
import { FiltersSidebar } from './components/products/FiltersSidebar';

// Blocks
import { TextBlock, textSchema } from './components/blocks/text';
import { HeadingBlock, headingSchema } from './components/blocks/heading';
import { ButtonBlock, buttonSchema } from './components/blocks/button';
import { MediaBlock, mediaSchema } from './components/blocks/media';
import { SearchBar } from './components/products/SearchBar';
import { LayeredSlideshow } from './components/sections/banners/LayeredSlideshow';
import { SlideshowFullFrame } from './components/sections/banners/SlideshowFullFrame';
import { SlideshowInset } from './components/sections/banners/SlideshowInset';
import { SplitShowcase } from './components/sections/banners/SplitShowcase';
import { CollectionLinksSpotlight } from './components/sections/collections/CollectionLinksSpotlight';
import { CollectionLinksText } from './components/sections/collections/CollectionLinksText';
import { CollectionListsBento } from './components/sections/collections/CollectionListsBento';
import { CollectionListsCarousel, collectionListsCarouselSchema } from './components/sections/collections/CollectionListsCarousel';
import { CollectionListsEditorial, collectionListsEditorialSchema } from './components/sections/collections/CollectionListsEditorial';
import { CollectionListsGrid, collectionListsGridSchema } from './components/sections/collections/CollectionListsGrid';
import { FeaturedCollectionCarousel } from './components/sections/products/FeaturedCollectionCarousel';
import { FeaturedCollectionEditorial } from './components/sections/products/FeaturedCollectionEditorial';
import { FeaturedCollectionGrid } from './components/sections/products/FeaturedCollectionGrid';
import { FeaturedProducts, featuredProductSchema } from './components/sections/products/FeaturedProducts';
import { ProductHighlight, productHighlightSchema } from './components/sections/products/ProductHighlight';
import { ProductHotspot, productHotspotSchema, HotspotBlock, hotspotBlockSchema } from './components/sections/products/ProductHotspot';
import { RecommendedProducts, recommendedProductsSchema } from './components/sections/products/RecommendedProducts';
import { BlogPostCarousel } from './components/sections/storytelling/BlogPostCarousel';
import { BlogPostEditorial } from './components/sections/storytelling/BlogPostEditorial';
import { BlogPostGrid } from './components/sections/storytelling/BlogPostGrid';
import { Carousel } from './components/sections/storytelling/Carousel';
import { Editorial } from './components/sections/storytelling/Editorial';
import { EditorialJumboText } from './components/sections/storytelling/EditorialJumboText';
import { ImageCompare } from './components/sections/storytelling/ImageCompare';
import { ImageWithText } from './components/sections/storytelling/ImageWithText';
import { FAQ } from './components/sections/text/FAQ';
import { IconsWithText } from './components/sections/text/IconsWithText';
import { Marquee } from './components/sections/text/Marquee';
import { Multicolumn } from './components/sections/text/Multicolumn';
import { PullQuote } from './components/sections/text/PullQuote';
import { RichText } from './components/sections/text/RichText';

// Mega-Components for Standard Pages
import { StandardProductDetail } from './components/pages/StandardProductDetail';
import { StandardCategoryPage } from './components/pages/StandardCategoryPage';
import { StandardCart } from './components/pages/StandardCart';
import { StandardCheckout } from './components/pages/StandardCheckout';

import { ComponentSchemas } from './component-schemas';

export const registry: Record<string, any> = {
  AnnouncementBar,
  AddSectionDropdown,
  CanvasRenderer,
  PropertiesEditor,
  SidebarSections,
  AddToCartButton,
  CartInitializer,
  CartSidebar,
  CartTrigger,
  CookieConsent,
  Footer,
  Header,
  HeroBottomAligned,
  HeroMarquee,
  Hero,
  LargeLogo,
  ProductCard,
  FiltersSidebar,
  SearchBar,
  LayeredSlideshow,
  SlideshowFullFrame,
  SlideshowInset,
  SplitShowcase,
  CollectionLinksSpotlight,
  CollectionLinksText,
  CollectionListsBento,
  CollectionListsCarousel,
  CollectionListsEditorial,
  CollectionListsGrid,
  FeaturedCollectionCarousel,
  FeaturedCollectionEditorial,
  FeaturedCollectionGrid,
  FeaturedProducts,
  ProductHighlight,
  ProductHotspot,
  RecommendedProducts,
  BlogPostCarousel,
  BlogPostEditorial,
  BlogPostGrid,
  Carousel,
  Editorial,
  EditorialJumboText,
  ImageCompare,
  ImageWithText,
  FAQ,
  IconsWithText,
  Marquee,
  Multicolumn,
  PullQuote,
  RichText,

  // Blocks
  Text: TextBlock,
  Heading: HeadingBlock,
  Button: ButtonBlock,
  Media: MediaBlock,
  HotspotBlock: HotspotBlock,

  // Standard Pages
  StandardProductDetail,
  StandardCategoryPage,
  StandardCart,
  StandardCheckout
};

export const schemaRegistry: Record<string, any> = {
  ...ComponentSchemas,
  Header: headerSchema,
  Footer: footerSchema,
  AnnouncementBar: announcementBarSchema,
  Hero: heroSchema,
  HeroBottomAligned: heroBottomAlignedSchema,
  CollectionListsCarousel: collectionListsCarouselSchema,
  CollectionListsEditorial: collectionListsEditorialSchema,
  CollectionListsGrid: collectionListsGridSchema,
  FeaturedProducts: featuredProductSchema,
  ProductHighlight: productHighlightSchema,
  ProductHotspot: productHotspotSchema,
  RecommendedProducts: recommendedProductsSchema,
  HotspotBlock: hotspotBlockSchema,
  Text: textSchema,
  Heading: headingSchema,
  Button: buttonSchema,
  Media: mediaSchema
};

export * from './components/builder/add-section-dropdown';
export * from './components/builder/canvas-renderer';
export * from './components/builder/properties-editor';
export * from './components/builder/sidebar-sections';
export * from './components/cart/AddToCartButton';
export * from './components/cart/CartInitializer';
export * from './components/cart/CartSidebar';
export * from './components/cart/CartTrigger';
export * from './components/cookie-consent';
export * from './components/footer';
export * from './components/sections/header/Header';
export * from './components/sections/header/AnnouncementBar';
export * from './components/sections/banners/HeroBottomAligned';
export * from './components/sections/banners/HeroMarquee';
export * from './components/sections/banners/Hero';
export * from './components/sections/banners/LargeLogo';
export * from './components/product-card';
export * from './components/products/FiltersSidebar';
export * from './components/products/SearchBar';
export * from './components/sections/banners/LayeredSlideshow';
export * from './components/sections/banners/SlideshowFullFrame';
export * from './components/sections/banners/SlideshowInset';
export * from './components/sections/banners/SplitShowcase';
export * from './components/sections/collections/CollectionLinksSpotlight';
export * from './components/sections/collections/CollectionLinksText';
export * from './components/sections/collections/CollectionListsBento';
export * from './components/sections/collections/CollectionListsCarousel';
export * from './components/sections/collections/CollectionListsEditorial';
export * from './components/sections/collections/CollectionListsGrid';
export * from './components/sections/products/FeaturedCollectionCarousel';
export * from './components/sections/products/FeaturedCollectionEditorial';
export * from './components/sections/products/FeaturedCollectionGrid';
export * from './components/sections/products/FeaturedProducts';
export * from './components/sections/products/ProductHighlight';
export * from './components/sections/products/ProductHotspot';
export * from './components/sections/products/RecommendedProducts';
export * from './components/sections/storytelling/BlogPostCarousel';
export * from './components/sections/storytelling/BlogPostEditorial';
export * from './components/sections/storytelling/BlogPostGrid';
export * from './components/sections/storytelling/Carousel';
export * from './components/sections/storytelling/Editorial';
export * from './components/sections/storytelling/EditorialJumboText';
export * from './components/sections/storytelling/ImageCompare';
export * from './components/sections/storytelling/ImageWithText';
export * from './components/sections/text/FAQ';
export * from './components/sections/text/IconsWithText';
export * from './components/sections/text/Marquee';
export * from './components/sections/text/Multicolumn';
export * from './components/sections/text/PullQuote';
export * from './components/sections/text/RichText';

export * from './components/pages/StandardProductDetail';
export * from './components/pages/StandardCategoryPage';
export * from './components/pages/StandardCart';
export * from './components/pages/StandardCheckout';
