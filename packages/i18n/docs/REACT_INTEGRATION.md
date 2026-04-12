# React Integration Guide

Guide for integrating @ecommerce/i18n into React applications (Storefront, Admin Dashboard)

## Installation

The i18n package is already available in the monorepo. Just import it in your React app.

## Setup

### 1. Initialize i18n in App Root

**apps/storefront/src/app.tsx** or **apps/admin/src/app.tsx**

```typescript
import { useEffect, useState } from 'react';
import { initializeI18n, useLanguage } from '@ecommerce/i18n';

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      // Initialize with auto-detection (URL, localStorage, browser)
      await initializeI18n();
      setIsInitialized(true);
    })();
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <LanguageSwitcher />
      <MainApp />
    </div>
  );
}

// Language switcher component
function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}>
      <option value="en">English</option>
      <option value="vi">Tiếng Việt</option>
    </select>
  );
}

function MainApp() {
  // Your main app content
  return <Dashboard />;
}
```

## Using Translations

### useTranslations Hook - Single Namespace

```typescript
import { useTranslations } from '@ecommerce/i18n';

export function LoginForm() {
  const t = useTranslations('auth');

  return (
    <form>
      <div>
        <label>{t('login.email')}</label>
        <input type="email" placeholder={t('login.emailPlaceholder')} />
      </div>
      <div>
        <label>{t('login.password')}</label>
        <input type="password" placeholder={t('login.passwordPlaceholder')} />
      </div>
      <button>{t('buttons.login')}</button>
      <p>{t('login.noAccount')} <a href="/register">{t('buttons.register')}</a></p>
    </form>
  );
}
```

### useI18n Hook - Full Control

```typescript
import { useI18n } from '@ecommerce/i18n';

export function ProductCard({ product }: { product: Product }) {
  const { t, language, setLanguage } = useI18n('shop');

  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <button>{t('buttons.addToCart')}</button>
      <button>{t('buttons.addToWishlist')}</button>
      <p>{t('product.sku')}: {product.sku}</p>
      <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}>
        <option value="en">English</option>
        <option value="vi">Tiếng Việt</option>
      </select>
    </div>
  );
}
```

### useTranslateKeys Hook - Translate Multiple Keys

```typescript
import { useTranslateKeys } from '@ecommerce/i18n';

export function FilterPanel() {
  const labels = useTranslateKeys('shop', [
    'filter.all',
    'filter.price',
    'filter.rating',
    'filter.availability',
    'buttons.apply',
    'buttons.reset',
  ]);

  return (
    <div>
      <h3>{labels['filter.all']}</h3>
      <div>
        <label>{labels['filter.price']}</label>
        {/* ... */}
      </div>
      <button>{labels['buttons.apply']}</button>
      <button>{labels['buttons.reset']}</button>
    </div>
  );
}
```

## Interpolation (Dynamic Values)

```typescript
import { useTranslations } from '@ecommerce/i18n';

export function WelcomeBanner({ userName }: { userName: string }) {
  const t = useTranslations('common');

  return (
    <div>
      {/* Assumes translation key: "welcome": "Welcome, {{name}}!" */}
      <h1>{t('welcome', { name: userName })}</h1>
    </div>
  );
}
```

## Number & Currency Formatting

```typescript
import { useFormatNumber, useFormatCurrency } from '@ecommerce/i18n';

export function PriceDisplay({ price }: { price: number }) {
  const formatCurrency = useFormatCurrency();
  const formatNumber = useFormatNumber();

  return (
    <div>
      <p>Price: {formatCurrency(price, 'USD')}</p>
      <p>Quantity: {formatNumber(1000)}</p> {/* 1,000 or 1.000 */}
    </div>
  );
}
```

## Date Formatting

```typescript
import { useFormatDate } from '@ecommerce/i18n';

export function OrderDate({ date }: { date: Date }) {
  const formatDate = useFormatDate();

  return (
    <p>
      Ordered on: {formatDate(date, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </p>
  );
}
```

## Multi-Namespace Translation

Some components need strings from multiple namespaces:

```typescript
import { useTranslations } from '@ecommerce/i18n';

export function CheckoutForm() {
  const tCommon = useTranslations('common');
  const tOrder = useTranslations('order');
  const tValidation = useTranslations('validation');

  return (
    <form>
      <h2>{tOrder('checkout.shippingInfo')}</h2>
      <div>
        <label>{tCommon('labels.address')}</label>
        <input required />
        <span className="error">{tValidation('address.required')}</span>
      </div>
      
      <h2>{tOrder('checkout.billingAddress')}</h2>
      {/* ... */}
      
      <button>{tCommon('buttons.continue')}</button>
    </form>
  );
}
```

## Error Messages

```typescript
import { useTranslations } from '@ecommerce/i18n';

export function FormField({ error }: { error?: Error }) {
  const t = useTranslations('errors');

  return (
    <div>
      <input />
      {error && (
        <span className="error">
          {t(error.message)} {/* e.g., t('validation.required') */}
        </span>
      )}
    </div>
  );
}
```

## Language Switching

```typescript
import { useLanguage } from '@ecommerce/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage, availableLanguages } = useLanguage();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}>
      {availableLanguages.map((lang) => (
        <option key={lang} value={lang}>
          {lang === 'en' ? 'English' : 'Tiếng Việt'}
        </option>
      ))}
    </select>
  );
}
```

## Context-Aware Component

```typescript
import { useI18n } from '@ecommerce/i18n';

export function ContextAwareModal() {
  const { t, language, setLanguage } = useI18n('common');

  return (
    <dialog>
      <h2>{t('modal.title')}</h2>
      <p>{t('modal.message')}</p>
      <footer>
        <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}>
          <option value="en">EN</option>
          <option value="vi">VI</option>
        </select>
        <button>{t('buttons.close')}</button>
      </footer>
    </dialog>
  );
}
```

## Best Practices

### ✅ DO

```typescript
// ✅ Initialize once at app root
useEffect(() => {
  initializeI18n();
}, []);

// ✅ Use hooks at component level
const t = useTranslations('auth');

// ✅ Keep namespace-specific
const tAuth = useTranslations('auth');
const tShop = useTranslations('shop');

// ✅ Interpolate values
t('messages.welcome', { name: 'John' });

// ✅ Handle missing keys gracefully
{t('key.that.might.be.missing') || 'Fallback text'}
```

### ❌ DON'T

```typescript
// ❌ Don't initialize multiple times
useEffect(() => {
  initializeI18n(); // Every render!
}, []);

// ❌ Don't hardcode strings
<button>Logout</button> // Should be t('buttons.logout')

// ❌ Don't mix namespaces incorrectly
t('auth:buttons.login'); // useTranslations already adds namespace

// ❌ Don't change language in render
const handleChange = () => setLanguage('vi'); // Do this in event handler, not render
```

## Styling Based on Language

```typescript
export function TextDirection() {
  const { language } = useLanguage();

  return (
    <div style={{
      direction: language === 'vi' ? 'ltr' : 'ltr', // Both LTR
      fontFamily: language === 'vi' ? '"Segoe UI", sans-serif' : 'sans-serif',
    }}>
      {/* Content */}
    </div>
  );
}
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTranslations } from '@ecommerce/i18n';

test('translations work', async () => {
  const { result } = renderHook(() => useTranslations('auth'));
  
  expect(result.current('buttons.login')).toBe('Login');
});

test('language switching works', async () => {
  const { result } = renderHook(() => useLanguage());
  
  act(() => {
    result.current.setLanguage('vi');
  });
  
  expect(result.current.language).toBe('vi');
});
```

## Troubleshooting

### Issue: Translations not showing

1. Check namespace spelling: `auth`, `shop`, `order`, etc.
2. Check key path: Must use dots for nesting: `login.email`
3. Check initialization: `initializeI18n()` called in App root
4. Check language: Use `useLanguage()` to verify current language

### Issue: Language not persisting

1. localStorage might be disabled in private mode
2. Check `setLanguagePreference()` is called when user changes language
3. Use URL parameter: `?lang=vi` for forced language

### Issue: Performance issues

- useTranslations is memoized, should be fast
- If using many languages, consider lazy loading
- Use useTranslateKeys for bulk translations

## Advanced: Custom Translation Resolver

```typescript
import { getI18nInstance } from '@ecommerce/i18n';

const i18n = getI18nInstance();

// Direct access to i18next methods
const translation = i18n.t('auth:buttons.login');
const language = i18n.language;
const exists = i18n.exists('auth:buttons.login');
```

---

For more info, see the main [README.md](../README.md)
