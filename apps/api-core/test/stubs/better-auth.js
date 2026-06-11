// Jest stub for `better-auth`.
//
// `betterAuth(options)` normally builds a full auth instance. For unit/integration
// tests we never exercise the real session machinery (it is mocked at the
// AuthService boundary), so we return a lightweight object exposing the same
// shape the app touches: an `api` namespace and a `handler`.
module.exports = {
  betterAuth(options = {}) {
    return {
      options,
      handler: async () => new Response(null, { status: 200 }),
      api: {
        getSession: jest.fn(async () => null),
        signInEmail: jest.fn(async () => ({ user: null, token: null })),
        signUpEmail: jest.fn(async () => ({ user: null, token: null })),
        signOut: jest.fn(async () => ({ success: true })),
      },
    };
  },
};
