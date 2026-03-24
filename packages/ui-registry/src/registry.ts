
import { Hero } from './components/hero';
import { ProductCard } from './components/product-card';
import { LargeLogo } from './components/large-logo';
import { SlideshowInset } from './components/slideshow-inset';
import { CollectionBento } from './components/collection-bento';
import { HeroBottomAligned } from './components/hero-bottom-aligned';
import { HeroMarquee } from './components/hero-marquee';
import { AnnouncementBar } from './components/announcement-bar';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { FeaturedCollection } from './components/featured-collection';
import { CookieConsent } from './components/cookie-consent';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Label } from './components/ui/label';

export const registry: Record<string, unknown> = {
  Hero,
  ProductCard,
  LargeLogo,
  SlideshowInset,
  CollectionBento,
  HeroBottomAligned,
  HeroMarquee,
  AnnouncementBar,
  Header,
  Footer,
  FeaturedCollection,
  CookieConsent,
  Button,
  Input,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  Progress,
  Label
};

export * from './components/hero';
export * from './components/product-card';
export * from './components/large-logo';
export * from './components/slideshow-inset';
export * from './components/collection-bento';
export * from './components/hero-bottom-aligned';
export * from './components/hero-marquee';
export * from './components/announcement-bar';
export * from './components/header';
export * from './components/footer';
export * from './components/featured-collection';
export * from './components/cookie-consent';
export * from './components/ui/button';
export * from './components/ui/input';
export * from './components/ui/card';
export * from './components/ui/progress';
export * from './components/ui/label';
