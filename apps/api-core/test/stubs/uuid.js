// uuid v14 ships ESM-only entrypoints (see the `bull > uuid 14` override in the
// root package.json). Under jest the resolver picks uuid's `node` export
// condition — an ESM file ts-jest's tsx-only transform won't compile — so any
// suite that transitively imports `bull` (order/payment/email modules) fails to
// parse. bull only needs `uuid.v4()` for job ids, so we map `uuid` to this thin
// CJS shim backed by crypto.randomUUID. Same approach as the better-auth stubs.
const { randomUUID } = require('crypto');

const v4 = () => randomUUID();

module.exports = {
  v1: v4,
  v3: v4,
  v4,
  v5: v4,
  v6: v4,
  v7: v4,
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  validate: () => true,
  version: () => 4,
  parse: (s) => s,
  stringify: (b) => b,
};
