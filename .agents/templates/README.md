# 📦 Master Templates — README

Reusable layouts, components, and configurations for quick shop setup.

---

## Available Templates

### 1. **Fashion**
- Header (logo, nav, search)
- Hero banner
- Product grid (by category)
- Testimonials
- Footer
- Colors: blacks, accent colors
- Target: Fashion, apparel, accessories stores

### 2. **Electronics**
- Detailed product specs layout
- Comparison grid
- Technical reviews section
- Rating system
- Warranty info
- Colors: blues, silvers
- Target: Tech, electronics retailers

### 3. **Health & Beauty**
- Hero image
- Before/after gallery
- Tutorial carousel
- Ingredient highlights
- Subscription section
- Colors: pastels, greens
- Target: Beauty, wellness, health brands

---

## How Templates Work

1. **Admin selects template** (e.g., "Fashion")
2. **Template applied** to shop via API
3. **Master template** (JSON) → merged with shop overrides
4. **Compiled layout** → sent to Storefront
5. **Shop rendered** with template design

---

## Creating Custom Template

Steps:
1. Design layout (Figma or mockup)
2. Create JSON schema (`template-fashion.md` template)
3. Design components in `packages/ui-library`
4. Add to master-templates package
5. Test on staging
6. Document in this folder

---

## Template Structure

```json
{
  "id": "fashion-template-v1",
  "name": "Fashion Template",
  "description": "Professional apparel store layout",
  "sections": [
    {
      "name": "header",
      "components": ["Logo", "Navigation", "SearchBar"]
    },
    {
      "name": "hero",
      "components": ["HeroBanner"]
    },
    {
      "name": "products",
      "components": ["ProductGrid", "Filters", "Pagination"]
    }
  ],
  "colors": {
    "primary": "#000000",
    "accent": "#FF6B6B"
  }
}
```

---

**Customize Templates**: See `custom-template-creation.md`
