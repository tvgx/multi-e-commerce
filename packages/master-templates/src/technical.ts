export default {
  "shopId": "MASTER_TECHNICAL",
  "isMaster": true,
  "templateType": "technical",
  "pages": {
    "home": [
      {
        "id": "hero-tech-1",
        "componentId": "HeroBannerStack",
        "order": 0,
        "props": {
          "title": "Industrial Solutions",
          "subtitle": "Precision-engineered parts for every machine.",
          "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80"
        }
      },
      {
        "id": "spec-table-1",
        "componentId": "SpecificationList",
        "order": 1,
        "props": {
          "title": "Key Features"
        }
      },
      {
        "id": "featured-tech-1",
        "componentId": "ProductTableGrid",
        "order": 2,
        "props": {
          "title": "New Arrivals",
          "columns": ["sku", "price", "stock"]
        }
      }
    ]
  },
  "metadata": {
    "theme": "technical",
    "primaryColor": "#1e293b",
    "fontFamily": "Inter"
  }
} as const;
