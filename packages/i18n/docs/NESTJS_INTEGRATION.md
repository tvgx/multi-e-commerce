# NestJS Integration Guide

Guide for integrating @ecommerce/i18n into NestJS API applications

## Installation

The i18n package is already available in the monorepo. Just import it in your NestJS app.

```bash
npm install @ecommerce/i18n
```

## Setup

### 1. Initialize in AppModule

**apps/api-core/src/app.module.ts**

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { initializeI18n } from '@ecommerce/i18n';

@Module({
  imports: [
    // ... other imports
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  async onModuleInit() {
    // Initialize i18n - detects language from environment or defaults to 'en'
    await initializeI18n(process.env.DEFAULT_LANGUAGE as 'en' | 'vi' || 'en');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LanguageMiddleware)
      .forRoutes('*'); // Apply language detection middleware to all routes
  }
}
```

### 2. Language Detection Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { setLanguagePreference, detectLanguage } from '@ecommerce/i18n';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get language from: query param > header > detect from browser hint
    const langParam = req.query.lang as string;
    const langHeader = req.headers['accept-language'] as string;

    let language: 'en' | 'vi' = 'en';

    if (langParam && ['en', 'vi'].includes(langParam)) {
      language = langParam as 'en' | 'vi';
    } else if (langHeader) {
      language = langHeader.startsWith('vi') ? 'vi' : 'en';
    }

    // Store in request for access in controllers/services
    (req as any).language = language;

    // Optional: Save user preference
    if (langParam) {
      setLanguagePreference(language);
    }

    next();
  }
}
```

### 3. Extend Express Request Type

**apps/api-core/src/types/express.d.ts**

```typescript
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      language?: 'en' | 'vi';
    }
  }
}
```

## Using Translations in Services

### TranslationService Injection

```typescript
import { Injectable } from '@nestjs/common';
import { TranslationService } from '@ecommerce/i18n';

@Injectable()
export class AuthService {
  constructor(private translationService: TranslationService) {}

  async login(email: string, password: string) {
    // Use the translation service
    if (!email || !password) {
      const errorMsg = this.translationService.translateValidation('required');
      throw new BadRequestException(errorMsg);
    }

    // Your login logic...
  }

  async register(email: string, password: string) {
    if (!isValidEmail(email)) {
      const ErrorMsg = this.translationService.translateValidation('email.invalid');
      throw new BadRequestException(errorMsg);
    }
  }
}
```

### Using in Controllers

```typescript
import { Controller, Post, Body, Req, HttpException } from '@nestjs/common';
import { TranslationService } from '@ecommerce/i18n';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private translationService: TranslationService,
  ) {}

  @Post('login')
  async login(
    @Body() { email, password }: LoginDto,
    @Req() req: any,
  ) {
    // Set language for this request
    this.translationService.setLanguage(req.language || 'en');

    try {
      return await this.authService.login(email, password);
    } catch (error) {
      // Error messages are already translated
      throw error;
    }
  }

  @Post('register')
  async register(
    @Body() { email, password }: RegisterDto,
    @Req() req: any,
  ) {
    this.translationService.setLanguage(req.language || 'en');
    return await this.authService.register(email, password);
  }
}
```

## Providing TranslationService

Create a provider so you can inject it:

**apps/api-core/src/i18n/i18n.provider.ts**

```typescript
import { Provider } from '@nestjs/common';
import { TranslationService, getTranslator } from '@ecommerce/i18n';

export const I18nProvider: Provider = {
  provide: TranslationService,
  useFactory: () => {
    return getTranslator('en');
  },
};
```

**apps/api-core/src/app.module.ts**

```typescript
import { I18nProvider } from './i18n/i18n.provider';

@Module({
  providers: [
    I18nProvider,
    AppService,
    // ... other providers
  ],
})
export class AppModule {}
```

## Request-Scoped Translation Service

For proper multi-language support, create request-scoped translation:

**apps/api-core/src/i18n/request-i18n.service.ts**

```typescript
import { Injectable, Scope, Inject, REQUEST } from '@nestjs/common';
import { Request } from 'express';
import { TranslationService } from '@ecommerce/i18n';

@Injectable({ scope: Scope.REQUEST })
export class RequestI18nService extends TranslationService {
  constructor(@Inject(REQUEST) private request: Request) {
    super((request as any).language || 'en');
  }

  // Inherits all TranslationService methods
  // Language is automatically set from request
}
```

**apps/api-core/src/app.module.ts**

```typescript
@Module({
  providers: [
    RequestI18nService,
    // ... other providers
  ],
})
export class AppModule {}
```

Now services can inject `RequestI18nService` instead of managing language themselves:

```typescript
@Injectable()
export class UserService {
  constructor(private i18n: RequestI18nService) {}

  validateEmail(email: string) {
    if (!isValidEmail(email)) {
      const msg = this.i18n.translateValidation('email.invalid');
      throw new BadRequestException(msg);
    }
  }
}
```

## Common Use Cases

### Error Handling

```typescript
import { Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private i18n: RequestI18nService) {}

  catch(exception: unknown, host: ExecutionContext) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = 500;
    let message = exception instanceof Error ? exception.message : 'internal.error';

    if (exception instanceof BadRequestException) {
      status = 400;
    } else if (exception instanceof NotFoundException) {
      status = 404;
      message = 'errors:notFound';
    }

    // Translate error message
    const translatedMessage = this.i18n.translateError(message);

    response.status(status).json({
      success: false,
      message: translatedMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Database Validation Errors

```typescript
@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private i18n: RequestI18nService,
  ) {}

  async createUser(data: CreateUserDto) {
    try {
      const user = await this.userRepository.create(data);
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const field = error.meta.target[0];
        const msg = this.i18n.translateValidation(`${field}.unique`);
        throw new ConflictException(msg);
      }
      throw error;
    }
  }
}
```

### Pagination Messages

```typescript
@Injectable()
export class ProductService {
  constructor(private i18n: RequestI18nService) {}

  async findAll(page: number, limit: number) {
    const products = await this.productRepository.find(page, limit);
    const total = await this.productRepository.count();

    const noResultsMsg = products.length === 0 
      ? this.i18n.t('shop', 'messages.noProductsFound')
      : null;

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        message: noResultsMsg,
      },
    };
  }
}
```

### Form Validation Messages

```typescript
import { validate } from 'class-validator';

@Injectable()
export class ValidationService {
  constructor(private i18n: RequestI18nService) {}

  async validateDto<T>(dto: T): Promise<Record<string, string>> {
    const errors = await validate(dto);
    const errorMessages: Record<string, string> = {};

    for (const error of errors) {
      const field = error.property;
      const constraint = Object.keys(error.constraints)[0];
      
      // Map validator constraint to translation key
      const translationKey = `${field}.${constraint}`;
      errorMessages[field] = this.i18n.translateValidation(translationKey);
    }

    return errorMessages;
  }
}
```

## Multi-Language API Response

```typescript
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService, private i18n: RequestI18nService) {}

  @Get()
  async getAll(@Query() query: QueryDto) {
    const products = await this.productService.findAll(query);

    return {
      success: true,
      message: this.i18n.t('common', 'messages.success'),
      language: this.i18n.getLanguage(),
      data: products,
    };
  }
}
```

## Scheduled Jobs Translation

For background jobs, you might need to send notifications in the user's language:

```typescript
import { Schedule, Cron } from '@nestjs/schedule';
import { getTranslator } from '@ecommerce/i18n';

@Injectable()
export class NotificationService {
  @Cron('0 0 * * *') // Daily at midnight
  async sendDailyEmails() {
    const users = await this.userRepository.findAll();

    for (const user of users) {
      // Use the user's preferred language
      const translator = getTranslator(user.preferredLanguage || 'en');
      
      const subject = translator.t('common', 'emails.dailyDigestSubject');
      const body = translator.t('common', 'emails.dailyDigestBody', {
        name: user.name,
      });

      await this.emailService.send(user.email, subject, body);
    }
  }
}
```

## GraphQL Integration

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';

@Resolver('User')
export class UserResolver {
  constructor(private userService: UserService, private i18n: RequestI18nService) {}

  @Query(() => UserType)
  async user(@Args('id') id: string) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      const msg = this.i18n.t('errors', 'notFound');
      throw new NotFoundException(msg);
    }

    return user;
  }
}
```

## Environment Configuration

**apps/api-core/.env**

```env
# Language configuration
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,vi

# For log messages if needed
LOG_LANGUAGE=en
```

## Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RequestI18nService } from './request-i18n.service';

describe('UserService', () => {
  let service: UserService;
  let i18n: RequestI18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: RequestI18nService,
          useValue: {
            translateValidation: jest.fn((key) => `translated: ${key}`),
            t: jest.fn((ns, key) => `translated: ${ns}:${key}`),
            setLanguage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    i18n = module.get<RequestI18nService>(RequestI18nService);
  });

  it('should validate email', () => {
    expect(() => service.validateEmail('invalid')).toThrow();
    expect(i18n.translateValidation).toHaveBeenCalled();
  });
});
```

## Best Practices

### ✅ DO

```typescript
// ✅ Use RequestI18nService (auto sets language per request)
constructor(private i18n: RequestI18nService) {}

// ✅ Use semantic methods
this.i18n.translateError('notFound');
this.i18n.translateValidation('required');
this.i18n.t('common', 'messages.success');

// ✅ Let middleware handle language detection
// Set language once in middleware, use throughout request

// ✅ Log in English for debugging
logger.error(`Database error: ${error.message}`);
```

### ❌ DON'T

```typescript
// ❌ Don't hardcode messages
throw new BadRequestException('Email is invalid');

// ❌ Don't query language multiple times
const lang1 = req.headers['accept-language'];
const lang2 = (req as any).language;

// ❌ Don't change language mid-request
this.i18n.setLanguage('vi'); // Use RequestI18nService instead

// ❌ Don't translate log messages
logger.error(this.i18n.translateError('error.database')); // Logs in user language!
```

## Troubleshooting

### Issue: Translations not found

1. Ensure `initializeI18n()` is called in `onModuleInit`
2. Check that namespace exists: `auth`, `shop`, `order`, etc.
3. Verify key path: `field.subfield.key`

### Issue: Wrong language in response

1. Check middleware is registered: `consumer.apply(LanguageMiddleware)`
2. Verify `(req as any).language` is set correctly
3. Ensure `RequestI18nService` is set to REQUEST scope

### Issue: Language not persisting between requests

- This is expected. Each request gets its language from query param or header
- For client-side persistence, use localStorage (handled by browser)

---

For more info, see the main [README.md](../README.md)
