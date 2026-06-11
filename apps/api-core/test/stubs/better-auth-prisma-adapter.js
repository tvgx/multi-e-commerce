// Jest stub for `better-auth/adapters/prisma`.
// Returns a no-op adapter factory; the auth instance it feeds is itself stubbed.
module.exports = {
  prismaAdapter(/* prisma, options */) {
    return () => ({ id: 'prisma-stub-adapter' });
  },
};
