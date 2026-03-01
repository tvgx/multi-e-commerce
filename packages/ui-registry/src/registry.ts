
import { Hero } from './components/hero';
import { ProductCard } from './components/product-card';
import { LargeLogo } from './components/large-logo';
import { SlideshowInset } from './components/slideshow-inset';
import { CollectionBento } from './components/collection-bento';
import { HeroBottomAligned } from './components/hero-bottom-aligned';
import { HeroMarquee } from './components/hero-marquee';

export const registry: Record<string, any> = {
  Hero,
  ProductCard,
  LargeLogo,
  SlideshowInset,
  CollectionBento,
  HeroBottomAligned,
  HeroMarquee
};

export * from './components/hero';
export * from './components/product-card';
export * from './components/large-logo';
export * from './components/slideshow-inset';
export * from './components/collection-bento';
export * from './components/hero-bottom-aligned';
export * from './components/hero-marquee';
