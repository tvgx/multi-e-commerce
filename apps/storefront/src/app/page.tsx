import { Hero, FeaturedCollection } from "@ecommerce/ui-registry";

export default function Home() {
  const dummyProducts = [
    {
      id: "p1",
      name: "Classic White Tee",
      price: 29.99,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60",
      slug: "classic-white-tee"
    },
    {
      id: "p2",
      name: "Denim Jacket",
      price: 89.99,
      imageUrl: "https://images.unsplash.com/photo-1551537482-f209bfc4487b?auto=format&fit=crop&w=500&q=60",
      slug: "denim-jacket"
    },
    {
      id: "p3",
      name: "Summer Dress",
      price: 59.99,
      imageUrl: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=500&q=60",
      slug: "summer-dress"
    },
    {
      id: "p4",
      name: "Leather Sneakers",
      price: 119.99,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=60",
      slug: "leather-sneakers"
    }
  ];

  return (
    <>
      <Hero
        title="Spring Collection 2026"
        subtitle="Discover our new arrivals and find your perfect style for this season."
        ctaText="Shop Now"
        ctaLink="/catalog"
        backgroundImageUrl="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80"
      />

      <FeaturedCollection
        title="Trending Now"
        description="Our most popular pieces handpicked for you."
        products={dummyProducts}
      />
    </>
  );
}
