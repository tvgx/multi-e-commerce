export default {
    "shopId": "MASTER_STANDARD",
    "isMaster": true,
    "templateType": "standard",
    "theme": {
        "colors": {
            "primary": "#0891B2",
            "secondary": "#087280",
            "warning": { "400": "#FBBF24", "500": "#F59E0B" },
            "destructive": { "500": "#EF4444", "600": "#DC2626" },
            "neutral": {
                "50": "#FAFAFA", "100": "#F5F5F5", "200": "#E5E5E5", "300": "#D4D4D4", 
                "400": "#A3A3A3", "500": "#737373", "600": "#525252", "700": "#404040", 
                "800": "#262626", "900": "#171717"
            }
        },
        "typography": {
            "fontFamily": "Roboto",
            "headings": {
                "h1": { "fontSize": "36pt", "fontWeight": "regular" },
                "h2": { "fontSize": "24pt", "fontWeight": "regular" },
                "h3": { "fontSize": "22pt", "fontWeight": "regular" }
            }
        }
    },
    "globalComponents": [
        {
            "id": "global-navbar",
            "componentId": "navbar",
            "props": {
                "brand": "Aladdin",
                "links": ["Home", "About Us", "Shop", "Contact Us", "My Account"],
                "cart_action": { "label": "Cart", "icon": "shopping-cart" },
                "search_config": {
                    "placeholder": "Search Aladdin",
                    "category_default": "All Categories",
                    "button_color": "#0891B2"
                }
            }
        },
        {
            "id": "global-footer",
            "componentId": "footer",
            "props": {
                "brand": "Aladdin",
                "tagline": "Aladdin for everyone order regular and become a prime customer.",
                "sections": {
                    "Product": ["Features", "Pricing", "Case studies", "Reviews", "Updates"],
                    "Company": ["About", "Contact us", "Careers", "Culture", "Blog"],
                    "Support": ["Getting started", "Help center", "Server status", "Report a bug", "Chat support"]
                },
                "copyright": "Copyright © 2023 BRIX Templates | All Rights Reserved"
            }
        }
    ],
    "pages": {
        "home": [
            {
                "id": "home-hero",
                "componentId": "hero_slider",
                "order": 1,
                "props": { "ref": "banners" }
            },
            {
                "id": "popular_categories",
                "componentId": "category_grid",
                "order": 2,
                "props": {
                    "title": "Explore popular category",
                    "items": [
                        { "label": "Beauty & Personal Care", "image": "beauty.jpg" },
                        { "label": "Health & Household", "image": "health.jpg" },
                        { "label": "Home & Kitchen", "image": "home.jpg" }
                    ]
                }
            }
        ],
        "product_listing": [
            {
                "id": "listing-header",
                "componentId": "page_header",
                "props": { "title": "Best Sellers" }
            }
        ]
    }
} as const;
