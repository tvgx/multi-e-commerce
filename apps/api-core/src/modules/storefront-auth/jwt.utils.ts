import * as crypto from 'crypto';

const SECRET =
  process.env.BETTER_AUTH_SECRET || 'default_fallback_secret_key_12345';

// Helper to base64url encode
function base64urlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate JWT Token
export function signJwt(
  payload: Record<string, any>,
  expiresInDays: number = 7,
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const iat = Math.floor(Date.now() / 1000);

  const payloadWithClaims = {
    ...payload,
    exp,
    iat,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payloadWithClaims));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

// Verify JWT Token
export function verifyJwt(token: string): Record<string, any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(signatureInput)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8'),
    );

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Unauthorized');
  }
}

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

// Verify Password
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}
