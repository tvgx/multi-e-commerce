import mongoose from 'mongoose';
import { UIComponentCatalogSchema } from '@ecommerce/database';
import { ComponentSchemas } from '@ecommerce/ui-registry/src/component-schemas';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../packages/database/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/multi-ecommerce?authSource=admin';

// Maps componentId → first preview image path (served from admin /public/section-previews)
const PREVIEW_IMAGE_MAP: Record<string, string> = {
  // Banners
  Hero: '/section-previews/banners/hero/media__1780241741556.png',
  HeroBottomAligned: '/section-previews/banners/header_bottom_aligned/media__1780242455808.png',
  HeroMarquee: '/section-previews/banners/hero_marquee/media__1780242500657.png',
  LargeLogo: '/section-previews/banners/large_logo/media__1780242605027.png',
  LayeredSlideshow: '/section-previews/banners/layered_slideshow/media__1780242704303.png',
  SlideshowFullFrame: '/section-previews/banners/slideshow_full_frame/media__1780243337620.png',
  SlideshowInset: '/section-previews/banners/slideshow_inset/media__1780243401235.png',
  SplitShowcase: '/section-previews/banners/spilt_showcase/media__1780243767084.png',
  FeaturedCollection: '/section-previews/banners/featured_collection/media__1780242002847.png',
  // Collections
  CollectionLinksSpotlight: '/section-previews/collections/spotlight/media__1780243921637.png',
  CollectionLinksText: '/section-previews/collections/collection_links_text/media__1780243988798.png',
  CollectionListsBento: '/section-previews/collections/collection_list_bento/media__1780244009660.png',
  CollectionListsCarousel: '/section-previews/collections/collection_list_carousel/media__1780244076381.png',
  CollectionListsEditorial: '/section-previews/collections/collection_list_editorial/media__1780244182514.png',
  CollectionListsGrid: '/section-previews/collections/collection_list_grid/media__1780244223854.png',
  FeaturedCollectionCarousel: '/section-previews/collections/featured_collection_carousel/media__1780244610965.png',
  FeaturedCollectionEditorial: '/section-previews/collections/featured_collection_editorial/media__1780244720003.png',
  FeaturedCollectionGrid: '/section-previews/collections/featured_collection_grid/media__1780244766344.png',
  // Products
  FeaturedProducts: '/section-previews/products/featured_product/media__1780244789282.png',
  ProductHighlight: '/section-previews/products/product_highlight/media__1780244827534.png',
  ProductHotspot: '/section-previews/products/product_hotspot/media__1780244931591.png',
  RecommendedProducts: '/section-previews/products/recommended_products/media__1780244951786.png',
};

// Maps componentId → UI category label
const CATEGORY_MAP: Record<string, string> = {
  Hero: 'Banners',
  HeroBottomAligned: 'Banners',
  HeroMarquee: 'Banners',
  LargeLogo: 'Banners',
  LayeredSlideshow: 'Banners',
  SlideshowFullFrame: 'Banners',
  SlideshowInset: 'Banners',
  SplitShowcase: 'Banners',
  FeaturedCollection: 'Banners',
  CollectionLinksSpotlight: 'Collections',
  CollectionLinksText: 'Collections',
  CollectionListsBento: 'Collections',
  CollectionListsCarousel: 'Collections',
  CollectionListsEditorial: 'Collections',
  CollectionListsGrid: 'Collections',
  FeaturedCollectionCarousel: 'Collections',
  FeaturedCollectionEditorial: 'Collections',
  FeaturedCollectionGrid: 'Collections',
  FeaturedProducts: 'Products',
  ProductHighlight: 'Products',
  ProductHotspot: 'Products',
  RecommendedProducts: 'Products',
  FiltersSidebar: 'Products',
  BlogPostCarousel: 'Storytelling',
  BlogPostEditorial: 'Storytelling',
  BlogPostGrid: 'Storytelling',
  Carousel: 'Storytelling',
  Editorial: 'Storytelling',
  EditorialJumboText: 'Storytelling',
  ImageCompare: 'Storytelling',
  ImageWithText: 'Storytelling',
  FAQ: 'Text',
  IconsWithText: 'Text',
  Marquee: 'Text',
  Multicolumn: 'Text',
  PullQuote: 'Text',
  RichText: 'Text',
  AnnouncementBar: 'Text',
  Header: 'Global',
  Footer: 'Global',
  HeaderMenuItem: 'Atomic Blocks',
  HeaderLanguageSwitcher: 'Atomic Blocks',
  HeaderCartTrigger: 'Atomic Blocks',
  FooterColumn: 'Atomic Blocks',
  SlideItem: 'Atomic Blocks',
  SearchBar: 'Atomic Blocks',
};

async function seed() {
  console.log('Connecting to MongoDB...', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const UIComponentCatalog =
    mongoose.models.UIComponentCatalog ||
    mongoose.model('UIComponentCatalog', UIComponentCatalogSchema);

  let seeded = 0;
  let updated = 0;

  for (const [componentId, schema] of Object.entries(ComponentSchemas)) {
    const mediaUrl = PREVIEW_IMAGE_MAP[componentId] || null;
    const category = CATEGORY_MAP[componentId] || (schema.type === 'block' ? 'Atomic Blocks' : 'Other');

    const doc = {
      componentId,
      name: schema.title,
      category,
      type: schema.type,
      settings: schema.settings || [],
      allowedBlocks: schema.allowedBlocks || [],
      defaultBlocks: (schema as any).defaultBlocks || [],
      mediaUrl,
    };

    const existing = await UIComponentCatalog.findOne({ componentId }).exec();
    if (existing) {
      await UIComponentCatalog.updateOne({ componentId }, { $set: doc }).exec();
      updated++;
    } else {
      await UIComponentCatalog.create(doc);
      seeded++;
    }
    console.log(`[${existing ? 'updated' : 'seeded'}] ${componentId} (${schema.title}) category=${category}${mediaUrl ? ' ✓ preview' : ''}`);
  }

  console.log(`\nDone: ${seeded} new, ${updated} updated.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
