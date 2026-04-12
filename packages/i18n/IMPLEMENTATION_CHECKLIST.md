# I18n Implementation Checklist

Status: **Phase 1 - Core Infrastructure Complete** ✅

Track the implementation progress for the @ecommerce/i18n package across all applications.

## Phase 1: Core Infrastructure ✅ COMPLETED

### Package Structure
- [x] Create directory structure (`packages/i18n/`)
- [x] Create `locales/en/` with all JSON files (common, auth, shop, order, errors, validation)
- [x] Create `locales/vi/` with all JSON files (Vietnamese translations)
- [x] Create `src/` directory with TypeScript source
- [x] Create `docs/` directory with integration guides

### Source Files
- [x] `src/types.ts` - Type definitions and interfaces
- [x] `src/utils/language.ts` - Language detection and preference management
- [x] `src/utils/index.ts` - Translation utility functions
- [x] `src/config.ts` - i18next configuration and initialization
- [x] `src/hooks.ts` - React hooks (useTranslations, useLanguage, useI18n, etc.)
- [x] `src/service.ts` - TranslationService for Node.js/NestJS backends
- [x] `src/index.ts` - Main export file with all public APIs

### Configuration Files
- [x] `package.json` - Dependencies, scripts, exports
- [x] `tsconfig.json` - TypeScript configuration
- [x] `README.md` - Main documentation
- [x] `docs/REACT_INTEGRATION.md` - React integration guide
- [x] `docs/NESTJS_INTEGRATION.md` - NestJS integration guide
- [x] `docs/CLI_INTEGRATION.md` - CLI integration guide

### Translation Content
- [x] English translations for all namespaces (200+ keys)
  - [x] common.json - UI labels, buttons, general messages
  - [x] auth.json - Authentication and login flows
  - [x] shop.json - Product catalog, shopping cart
  - [x] order.json - Checkout, payment, tracking
  - [x] errors.json - Error messages
  - [x] validation.json - Form validation messages
- [x] Vietnamese translations with full parity
  - [x] common.json - Vietnamese UI elements
  - [x] auth.json - Vietnamese auth messages
  - [x] shop.json - Vietnamese product language
  - [x] order.json - Vietnamese order messages
  - [x] errors.json - Vietnamese error messages
  - [x] validation.json - Vietnamese validation rules

---

## Phase 2: Frontend Integration 🔄 IN PROGRESS

### Storefront App (apps/storefront/)
- [ ] Install @ecommerce/i18n dependency
- [ ] Initialize i18n in root App component
- [ ] Create LanguageSwitcher component
- [ ] Add language middleware
- [ ] Integrate with:
  - [ ] Header/Navigation components
  - [ ] Product listing pages
  - [ ] Shopping cart
  - [ ] Checkout flow
  - [ ] User account pages
  - [ ] Help/FAQ sections
  - [ ] Error pages

### Admin Dashboard (apps/admin/)
- [ ] Install @ecommerce/i18n dependency
- [ ] Initialize i18n in root App component
- [ ] Create LanguageSwitcher component
- [ ] Add language middleware
- [ ] Integrate with:
  - [ ] Shop management
  - [ ] Product management
  - [ ] Order management
  - [ ] User management
  - [ ] Settings pages

### Shared UI Components (packages/ui-registry/)
- [ ] Create localized UI component library
  - [ ] Button texts
  - [ ] Form labels
  - [ ] Dialog/Modal messages
  - [ ] Toast/Alert messages
  - [ ] Table headers
  - [ ] Pagination text

---

## Phase 3: Backend Integration 🔄 IN PROGRESS

### API Core (apps/api-core/)
- [ ] Install @ecommerce/i18n dependency
- [ ] Initialize i18n in AppModule bootstrap
- [ ] Create LanguageMiddleware
- [ ] Create RequestI18nService (request-scoped)
- [ ] Integrate with:
  - [ ] Auth module (login errors, validation messages)
  - [ ] Shop module (error messages, validation)
  - [ ] Product module (error responses)
  - [ ] Order module (status messages, errors)
  - [ ] User module (validation, errors)
  - [ ] Exception filters (translate error responses)
  - [ ] Guards and interceptors

### CLI Tool (apps/cli-tool/)
- [ ] Add language detection from:
  - [ ] Command-line arguments (`--lang=vi`)
  - [ ] Environment variables (`ECOMMERCE_CLI_LANG`)
  - [ ] User config file (`~/.ecommerce-cli/config.json`)
- [ ] Create command handlers with translations for:
  - [ ] shop commands (list, create, get, update)
  - [ ] backup commands (create, list, restore)
  - [ ] health commands (check, report)
  - [ ] batch commands (create, execute)
  - [ ] audit commands (view, export)
- [ ] Create interactive prompts with translations
- [ ] Implement colored output with chalk
- [ ] Add help/usage messages
- [ ] Create configuration management

### Database Package (packages/database/)
- [ ] Add support for translating:
  - [ ] Validation error messages from Prisma
  - [ ] Constraint violation messages
  - [ ] Migration messages

---

## Phase 4: Integration Testing 📋 NOT STARTED

### Unit Tests
- [ ] Test language detection logic
- [ ] Test translation key resolution
- [ ] Test interpolation with values
- [ ] Test pluralization
- [ ] Test language switching

### Integration Tests
- [ ] React hook tests
- [ ] NestJS service injection tests
- [ ] CLI language parameter tests
- [ ] Multi-namespace translation tests

### E2E Tests
- [ ] Test full checkout flow in both languages
- [ ] Test admin panel in both languages
- [ ] Test CLI commands in both languages

---

## Phase 5: Documentation & Deployment 📋 NOT STARTED

### Documentation
- [ ] Add FAQ for common translation issues
- [ ] Create troubleshooting guide
- [ ] Document how to add new languages
- [ ] Document how to add new translation keys
- [ ] Create translation contributor guidelines

### Deployment
- [ ] Add to root workspace in package.json (if not auto-detected)
- [ ] Build i18n package: `npm run build` from root
- [ ] Build examples for each app type
- [ ] Create deployment scripts

### CI/CD
- [ ] Add to GitHub Actions build pipeline
- [ ] Add translation validation tests
- [ ] Add missing translation detection
- [ ] Add translation coverage reports

---

## Quick Integration Checklist

### For Frontend Developers (React)
```bash
# 1. In App.tsx root
import { initializeI18n } from '@ecommerce/i18n';
await initializeI18n();

# 2. In any component
import { useTranslations } from '@ecommerce/i18n';
const t = useTranslations('namespace');
<button>{t('buttons.login')}</button>

# 3. Run build
npm run build -w @ecommerce/i18n
npm run dev
```

### For Backend Developers (NestJS)
```bash
# 1. In AppModule
await initializeI18n(process.env.DEFAULT_LANGUAGE || 'en');
consumer.apply(LanguageMiddleware).forRoutes('*');

# 2. In any service
constructor(private i18n: RequestI18nService) {}
const msg = this.i18n.t('auth', 'errors.invalidPassword');

# 3. Run build
npm run build -w @ecommerce/i18n
npm run build -w api-core
```

### For CLI Developers
```bash
# 1. In main.ts
await initializeI18n(language);
const t = getTranslator(language);

# 2. Use in commands
console.log(t.t('shop', 'messages.created'));

# 3. Run build
npm run build -w @ecommerce/i18n
npm run dev
```

---

## Known Translation Keys

### Common Namespace
- `buttons.login` / `buttons.logout` / `buttons.register`
- `labels.email` / `labels.password` / `labels.name`
- `messages.success` / `messages.loading` / `messages.error`

### Auth Namespace
- `login.*` - Login form fields and messages
- `register.*` - Registration flow
- `validation.*` - Auth validation errors

### Shop Namespace
- `product.*` - Product information labels
- `cart.*` - Shopping cart operations
- `wishlist.*` - Wishlist management
- `filter.*` - Product filtering

### Order Namespace
- `checkout.*` - Checkout process
- `payment.*` - Payment methods
- `tracking.*` - Order tracking
- `shipping.*` - Shipping information

### Errors Namespace
- `validation.*` - Validation error messages
- `server.*` - Server/API errors
- `notFound` - 404 errors
- `unauthorized` - 401 errors

### Validation Namespace
- `required` - Field required message
- `email.invalid` - Invalid email format
- `minLength` - Minimum length validation
- `pattern` - Pattern validation errors

---

## Translation Coverage Report

| Namespace | Keys | EN | VI | Complete |
|-----------|------|----|----|----------|
| common    | 20   | ✅ | ✅ | 100%     |
| auth      | 35   | ✅ | ✅ | 100%     |
| shop      | 45   | ✅ | ✅ | 100%     |
| order     | 55   | ✅ | ✅ | 100%     |
| errors    | 30   | ✅ | ✅ | 100%     |
| validation| 19   | ✅ | ✅ | 100%     |
| **TOTAL** | 204  | ✅ | ✅ | **100%** |

---

## Next Steps

### Immediate (This Week)
1. [ ] Build i18n package: `npm run build -w @ecommerce/i18n`
2. [ ] Update root package.json to include i18n in workspaces
3. [ ] Test imports work from consuming packages
4. [ ] Create example integration file for each app

### Short Term (This Month)
1. [ ] Integrate with Storefront app
2. [ ] Integrate with Admin app
3. [ ] Integrate with API backend
4. [ ] Add comprehensive tests

### Medium Term (Next Quarter)
1. [ ] Add more languages if needed
2. [ ] Create translation management dashboard
3. [ ] Implement real-time translation updates
4. [ ] Add translation analytics

---

## Resources

- **Main Documentation**: [README.md](./README.md)
- **React Integration**: [docs/REACT_INTEGRATION.md](./docs/REACT_INTEGRATION.md)
- **NestJS Integration**: [docs/NESTJS_INTEGRATION.md](./docs/NESTJS_INTEGRATION.md)
- **CLI Integration**: [docs/CLI_INTEGRATION.md](./docs/CLI_INTEGRATION.md)
- **i18next Docs**: https://www.i18next.com/

---

## Support

For questions or issues:
1. Check the relevant integration guide
2. Review the README.md for API reference
3. Check translation key naming conventions
4. Verify language is properly initialized

---

**Last Updated**: 2026-04-06  
**Next Review**: 2026-04-13  
**Status**: Core infrastructure complete, ready for application integration
