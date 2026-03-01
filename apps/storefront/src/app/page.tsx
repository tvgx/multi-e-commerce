"use client";

import { Hero, ProductCard, LargeLogo, SlideshowInset, CollectionBento, HeroBottomAligned, HeroMarquee } from "@ecommerce/ui-registry";

export default function Home() {
  const products = [ // Hard code for testing
    { id: "1", name: "Modern Setup", price: 299.00, description: "Minimalist desk essentials for your workspace." },
    { id: "2", name: "Premium Backpack", price: 145.00, description: "Durable and stylish backpack for everyday use." },
    { id: "3", name: "Smart Device", price: 599.99, description: "Stay connected with the latest technology." },
  ];

  const bentoItems = [
    { id: "b1", title: "Summer Collection", link: "/summer", colSpan: 2 as const, rowSpan: 2 as const },
    { id: "b2", title: "Accessories", link: "/accessories", colSpan: 1 as const, rowSpan: 1 as const },
    { id: "b3", title: "Footwear", link: "/footwear", colSpan: 1 as const, rowSpan: 1 as const },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <HeroMarquee marqueeText="Explore our latest products" />

      <LargeLogo text="My Store" subtext="Made with care and unconditionally loved by our customers." />

      <HeroBottomAligned
        title="New arrivals"
        subtitle="Made with care and unconditionally loved by our customers. Signature bestseller exceeds all expectations."
        ctaText="Shop now"
        ctaLink="/shop-now"
      />

      <SlideshowInset
        title="Elevate Your Space"
        subtitle="Discover our newest curated collection for spring."
        ctaText="Shop Collection"
        ctaLink="/collections/spring"
      />

      <CollectionBento heading="Curated just for you" items={bentoItems} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">Featured Products</h2>
          <a href="/shop" className="text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">View all &rarr;</a>
        </div>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </main>
    </div>
  );
}
