// Jest stub for `better-auth/node`.
//
// The real package ships ESM (.mjs) which Jest's ts-jest transform does not
// process, causing "Cannot use import statement outside a module". None of the
// auth *logic* under test depends on the real implementation — services call
// `fromNodeHeaders` only to convert Express headers into a Fetch `Headers`
// object before delegating to the better-auth instance (which is itself mocked
// in unit tests). A faithful-enough conversion keeps that code path runnable.
module.exports = {
  fromNodeHeaders(nodeHeaders = {}) {
    const headers = new Map();
    for (const [key, value] of Object.entries(nodeHeaders)) {
      if (value === undefined) continue;
      headers.set(
        String(key).toLowerCase(),
        Array.isArray(value) ? value.join(', ') : String(value),
      );
    }
    // Expose a minimal Headers-like surface.
    return {
      get: (name) => headers.get(String(name).toLowerCase()) ?? null,
      has: (name) => headers.has(String(name).toLowerCase()),
      entries: () => headers.entries(),
      forEach: (cb) => headers.forEach((v, k) => cb(v, k)),
      _map: headers,
    };
  },
};
