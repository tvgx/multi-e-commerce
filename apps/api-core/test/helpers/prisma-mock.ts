/**
 * createMockPrisma — a zero-config, auto-vivifying mock of PrismaService.
 *
 * Accessing any model delegate (`prisma.product`) lazily creates a stable proxy,
 * and accessing any method on it (`prisma.product.findMany`) lazily creates a
 * stable `jest.fn()`. "Stable" means repeated access returns the same function,
 * so tests can configure `prisma.product.findMany.mockResolvedValue(...)` and
 * later assert `expect(prisma.product.findMany).toHaveBeenCalledWith(...)`.
 *
 * `$transaction` has a sensible default: a callback form receives the same proxy
 * (interactive transactions), and an array form resolves all entries. Tests may
 * override it like any other jest.fn.
 */
export type MockPrisma = any;

function makeDelegate(): any {
  const methods = new Map<string, jest.Mock>();
  return new Proxy(
    {},
    {
      get(_target, method) {
        if (typeof method !== 'string') return undefined;
        if (!methods.has(method)) methods.set(method, jest.fn());
        return methods.get(method);
      },
    },
  );
}

export function createMockPrisma(): MockPrisma {
  const delegates = new Map<string, any>();
  const topLevel = new Map<string, jest.Mock>();

  const proxy: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== 'string') return undefined;
        // Never let the proxy masquerade as a thenable when awaited/returned.
        if (prop === 'then') return undefined;

        if (prop === '$transaction') {
          if (!topLevel.has(prop)) {
            topLevel.set(
              prop,
              jest.fn(async (arg: any, _opts?: unknown) => {
                if (typeof arg === 'function') return arg(proxy);
                if (Array.isArray(arg)) return Promise.all(arg);
                return undefined;
              }),
            );
          }
          return topLevel.get(prop);
        }

        // Client-level helpers: $connect, $disconnect, $queryRaw, $executeRaw…
        if (prop.startsWith('$')) {
          if (!topLevel.has(prop)) topLevel.set(prop, jest.fn());
          return topLevel.get(prop);
        }

        // Model delegates: prisma.user, prisma.product, …
        if (!delegates.has(prop)) delegates.set(prop, makeDelegate());
        return delegates.get(prop);
      },
    },
  );

  return proxy;
}
