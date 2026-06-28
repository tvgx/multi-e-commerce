import { signJwt, verifyJwt, hashPassword, verifyPassword } from './jwt.utils';

describe('jwt.utils', () => {
  describe('signJwt / verifyJwt round-trip', () => {
    it('produces a 3-part HS256 token that verifies back to the payload', () => {
      const token = signJwt({ sub: 'c1', email: 'a@b.com', shopId: 's1' });
      expect(token.split('.')).toHaveLength(3);

      const payload = verifyJwt(token);
      expect(payload).toMatchObject({ sub: 'c1', email: 'a@b.com', shopId: 's1' });
      expect(typeof payload.exp).toBe('number');
      expect(typeof payload.iat).toBe('number');
    });

    it('rejects a token with a tampered payload (signature mismatch)', () => {
      const token = signJwt({ sub: 'c1' });
      const [h, , s] = token.split('.');
      const forgedPayload = Buffer.from(JSON.stringify({ sub: 'admin' }))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      expect(() => verifyJwt(`${h}.${forgedPayload}.${s}`)).toThrow(
        'Invalid signature',
      );
    });

    it('rejects a structurally invalid token', () => {
      expect(() => verifyJwt('not-a-jwt')).toThrow('Invalid token structure');
    });

    it('rejects an expired token', () => {
      // expiresInDays negative -> exp in the past
      const expired = signJwt({ sub: 'c1' }, -1);
      expect(() => verifyJwt(expired)).toThrow('Token expired');
    });
  });

  describe('hashPassword / verifyPassword', () => {
    it('verifies a correct password and rejects an incorrect one', async () => {
      const hash = await hashPassword('s3cret');
      expect(hash).toContain(':');
      await expect(verifyPassword('s3cret', hash)).resolves.toBe(true);
      await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
    });

    it('returns false for a malformed hash', async () => {
      await expect(verifyPassword('x', 'no-colon')).resolves.toBe(false);
    });
  });
});
