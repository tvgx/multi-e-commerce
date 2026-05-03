export default {
  "shopId": "MASTER_STANDARD",
  "isMaster": true,
  "templateType": "standard",
  "pages": {
    "home": [
      {
        "id": "hero-1",
        "componentId": "Hero",
        "order": 0,
        "props": {
          "title": "Welcome to our Store",
          "subtitle": "Everything you need in one place.",
          "imageUrl": "https://images.unsplash.com/photo-1534452286302-995d15a595de?auto=format&fit=crop&q=80"
        }
      },
      {
        "id": "featured-collections-1",
        "componentId": "CategoryGrid",
        "order": 1,
        "props": {
          "title": "Shop by Category"
        }
      },
      {
        "id": "featured-products-1",
        "componentId": "FeaturedCollection",
        "order": 2,
        "props": {
          "title": "Featured Products",
          "limit": 8
        }
      }
    ]
  },
  "metadata": {
    "theme": "vibrant",
    "primaryColor": "#2563eb",
    "fontFamily": "Inter"
  }
} as const;
