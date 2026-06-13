import type { ExecutionContext } from '@nestjs/common';

/**
 * Shared mock factories for NestJS providers and external services.
 * Keep these faithful to the real method names so type-free unit tests still
 * catch typos in the call sites under test.
 */

/** Build an object of jest.fn() for the given method names. */
export function mockMethods<T extends string>(
  names: readonly T[],
): Record<T, jest.Mock> {
  return names.reduce(
    (acc, name) => {
      acc[name] = jest.fn();
      return acc;
    },
    {} as Record<T, jest.Mock>,
  );
}

/** A `{ provide, useValue }` pair exposing jest.fn() for each named method. */
export function mockProvider(token: unknown, methods: readonly string[]) {
  return { provide: token, useValue: mockMethods(methods) };
}

/** @nestjs/cache-manager Cache mock. */
export function createMockCache() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    wrap: jest.fn(),
    store: {
      keys: jest.fn().mockResolvedValue([]),
      mget: jest.fn(),
      mset: jest.fn(),
    },
  };
}

/** @nestjs/config ConfigService mock backed by a plain values object. */
export function createMockConfig(values: Record<string, unknown> = {}) {
  return {
    get: jest.fn((key: string, fallback?: unknown) =>
      key in values ? values[key] : fallback,
    ),
    getOrThrow: jest.fn((key: string) => {
      if (!(key in values)) throw new Error(`Missing config: ${key}`);
      return values[key];
    }),
  };
}

/** MinioService mock (S3-style object storage). */
export function createMockMinio() {
  return {
    getBucketName: jest.fn().mockReturnValue('test-bucket'),
    uploadFile: jest
      .fn()
      .mockResolvedValue('https://cdn.test/test-bucket/object.jpg'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    fileExists: jest.fn().mockResolvedValue(true),
    listKeys: jest.fn().mockResolvedValue([]),
    onModuleInit: jest.fn(),
  };
}

/** EmailService mock. */
export function createMockEmail() {
  return mockMethods([
    'sendOrderConfirmation',
    'sendOrderShipped',
    'sendPaymentConfirmed',
    'sendResetPasswordEmail',
  ] as const);
}

/** A Bull queue mock (`@nestjs/bull` `@InjectQueue`). */
export function createMockQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    process: jest.fn(),
    getJob: jest.fn(),
  };
}

/** A Mongoose Model mock for `@InjectModel`. */
export function createMockMongooseModel() {
  const model: any = jest.fn().mockImplementation((doc: any) => ({
    ...doc,
    save: jest.fn().mockResolvedValue({ _id: 'mongo-id', ...doc }),
  }));
  Object.assign(model, {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    }),
    create: jest.fn().mockResolvedValue({ _id: 'mongo-id' }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    countDocuments: jest.fn().mockResolvedValue(0),
  });
  return model;
}

/**
 * Override a guard so a controller's HTTP routes run without real auth.
 * Attaches the given user (and derived shopIds) to the request, mirroring what
 * BetterAuthGuard / StorefrontAuthGuard do on success.
 */
export function passingGuard(user: Record<string, unknown> | null = null) {
  return {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      if (user) {
        req.user = user;
        req.session = { id: 'test-session' };
        req.authType = (user.authType as string) ?? 'owner';
        req.shopIds = (user.shopIds as string[]) ?? [];
      }
      return true;
    },
  };
}

/** A guard that always denies (for testing 403/401 paths). */
export function denyingGuard() {
  return { canActivate: () => false };
}
