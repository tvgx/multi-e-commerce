# @ecommerce/i18n - Internationalization Package

Centralized internationalization system supporting **Vietnamese** and **English** across the entire e-commerce platform.

## Overview

This package provides:
- 📍 **Language Detection** - Automatic language detection via URL, localStorage, or browser settings
- 🌐 **200+ Translation Keys** - Organized by namespace (common, auth, shop, order, errors, validation)
- 🔤 **Full TypeScript Support** - Type-safe translations with full IDE autocompletion
- ⚡ **Zero HTTP Overhead** - Resources loaded directly at build time
- 🔌 **Framework Agnostic** - Works with React, NestJS, CLI, and pure Node.js

## Installation

```bash
npm install @ecommerce/i18n
```

## Supported Languages

- **English** (`en`) - Default language
- **Vietnamese** (`vi`) - Alternative language

## Quick Start

### React Frontend (Storefront/Admin)

```typescript
import { initializeI18n, useTranslations } from '@ecommerce/i18n';

// 1. Initialize once at app startup
async function initApp() {
  await initializeI18n('en'); // or auto-detect
}

// 2. Use in components
function LoginForm() {
  const t = useTranslations('auth');
  
  return <form>
    <label>{t('login.email')}</label>
    <label>{t('login.password')}</label>
    <button>{t('buttons.login')}</button>
  </form>;
}
```

### NestJS Backend (API)

```typescript
import { initializeI18n, getTranslationService } from '@ecommerce/i18n';

// In AppModule bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await initializeI18n('en');
  await app.listen(3000);
}

// In services
@Injectable()
export class AuthService {
  private t = getTranslationService();
  
  async login(email: string) {
    const errorMsg = this.t.translate('errors.invalid.credentials', 'en');
    throw new UnauthorizedException(errorMsg);
  }
}
```

### Node.js/CLI

```typescript
import { initializeI18n, t } from '@ecommerce/i18n';

async function main() {
  await initializeI18n('vi'); // Vietnamese
  
  console.log(t('common.welcome', 'vi'));
  console.log(t('buttons.confirm', 'vi'));
}

main();
```

## API Reference

### Core Functions

#### `initializeI18n(language?: Language): Promise<void>`
Initialize the i18n system with optional language preference.

```typescript
await initializeI18n('en');
```

#### `getI18nInstance(): I18nService`
Get the initialized i18n service instance.

```typescript
const i18n = getI18nInstance();
```

#### `detectLanguage(): Language`
Auto-detect user's language from URL, localStorage, or browser settings.

```typescript
const lang = detectLanguage(); // 'en' or 'vi'
```

### Language Management

#### `setLanguagePreference(language: Language): void`
Persist user's language preference to localStorage.

```typescript
setLanguagePreference('vi');
```

#### `getLanguagePreference(): Language | null`
Retrieve saved language preference.

```typescript
const saved = getLanguagePreference();
```

#### `isLanguageSupported(lang: string): boolean`
Check if a language is supported.

```typescript
if (isLanguageSupported('vi')) { /* ... */ }
```

### Translation Utilities

#### `interpolate(template: string, values: Record<string, any>): string`
Replace `{{key}}` placeholders with values.

```typescript
const msg = interpolate('Hello {{name}}!', { name: 'John' });
// "Hello John!"
```

#### `pluralize(key: string, count: number, language: Language): string`
Get plural or singular form based on count.

```typescript
pluralize('item', 5, 'en'); // "items"
pluralize('sản phẩm', 1, 'vi'); // "sản phẩm"
```

#### `parseTranslationKey(key: string): { namespace: Namespace; key: string }`
Parse fully-qualified translation key.

```typescript
parseTranslationKey('auth:login.email');
// { namespace: 'auth', key: 'login.email' }
```

## Namespaces

### `common` - General UI Elements
Buttons, labels, navigation, generic text

### `auth` - Authentication & Authorization
Login, registration, password reset, user onboarding

### `shop` - Product Catalog & Shopping
Product listing, categories, cart, wishlist, filters

### `order` - Order & Payment Management
Checkout, shipping, payment methods, order tracking

### `errors` - Error Messages
Validation errors, server errors, user-facing messages

### `validation` - Form Validation Rules
Field-level validation messages, constraints

## Translation Keys

### Auth Namespace
```
auth:buttons.login
auth:buttons.register
auth:buttons.forgotPassword
auth:login.email
auth:login.password
auth:register.confirmPassword
auth:messages.loginSuccess
auth:messages.invalidCredentials
auth:validation.emailRequired
```

### Shop Namespace
```
shop:categories.electronics
shop:categories.fashion
shop:product.title
shop:cart.addToCart
shop:cart.removeItem
shop:wishlist.addToWishlist
shop:filter.all
shop:filter.price
```

### Order Namespace
```
order:checkout.shippingInfo
order:checkout.billingAddress
order:payment.method
order:payment.creditCard
order:tracking.orderNumber
order:tracking.status
```

### Error Namespace
```
errors:validation.required
errors:validation.email
errors:validation.minLength
errors:server.internal
errors:server.notFound
```

## Directory Structure

```
packages/i18n/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # TypeScript types
│   ├── config.ts             # i18next configuration
│   └── utils/
│       ├── index.ts          # Translation utilities
│       └── language.ts       # Language detection
├── locales/
│   ├── en/                   # English translations
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── shop.json
│   │   ├── order.json
│   │   ├── errors.json
│   │   └── validation.json
│   └── vi/                   # Vietnamese translations
│       ├── common.json
│       ├── auth.json
│       ├── shop.json
│       ├── order.json
│       ├── errors.json
│       └── validation.json
├── package.json
├── tsconfig.json
└── README.md
```

## Language Detection Strategy

The system automatically detects user language in this priority order:

1. **URL Parameter** - `?lang=vi` or `?lang=en`
2. **LocalStorage** - User's saved preference
3. **Browser Language** - Browser's Accept-Language header
4. **Default** - English (`en`)

```typescript
// Example: URL parameter takes priority
// https://example.com?lang=vi → Vietnamese
// https://example.com → Auto-detect from browser
```

## Type Safety

Full TypeScript support with enums and interfaces:

```typescript
type Language = 'en' | 'vi';

enum Namespace {
  Common = 'common',
  Auth = 'auth',
  Shop = 'shop',
  Order = 'order',
  Errors = 'errors',
  Validation = 'validation',
}

interface TranslationOptions {
  interpolate?: Record<string, any>;
  pluralKey?: string;
  defaultValue?: string;
}

interface I18nConfig {
  defaultLanguage: Language;
  supportedLanguages: Language[];
  fallbackLanguage: Language;
  resources: Record<Language, Record<Namespace, Record<string, any>>>;
}
```

## Adding New Translations

1. **Add to locale files**:
   ```json
   // locales/en/custom.json
   {
     "feature": {
       "title": "My Feature",
       "description": "Feature description"
     }
   }
   ```

2. **Update types** if adding new namespace:
   ```typescript
   enum Namespace {
     // ... existing
     Custom = 'custom',
   }
   ```

3. **Update config** to include new namespace in resources

4. **Use in code**:
   ```typescript
   t('custom:feature.title', 'en');
   ```

## Performance Optimization

- 📦 **Bundle Optimization** - Locale files included in build, zero runtime HTTP
- 🎯 **Lazy Loading** - Only active language loaded in memory
- ⚡ **Cached Lookups** - Translation keys cached after first access
- 🔄 **Hot Reload** - Development mode supports hot reload of translations

## Troubleshooting

### Translation Key Not Found
Check that:
- Namespace is spelled correctly: `auth`, `shop`, `order`, etc.
- Key path uses dots for nested objects: `login.email`
- Language is supported: `'en'` or `'vi'`

```typescript
// ❌ Wrong
t('auth.login.email');

// ✅ Correct
t('auth:login.email');
```

### Wrong Language Displayed
Clear localStorage and check URL:

```typescript
localStorage.clear();
setLanguagePreference('en');
// Or use URL: ?lang=en
```

## Contributing

When adding new features requiring translations:

1. Add both English and Vietnamese entries
2. Keep naming convention: `domain.section.key`
3. Update this README with new namespace info
4. Run type checking: `npm run type-check`

## License

MIT

---

**Last Updated**: April 2026  
**Maintained By**: E-commerce Platform Team
