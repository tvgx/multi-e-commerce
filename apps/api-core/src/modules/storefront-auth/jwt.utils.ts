import { UnauthorizedException } from '@nestjs/common';
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

// Verify JWT Token.
// Ném UnauthorizedException (HttpException) với message cụ thể thay vì gộp tất cả
// thành plain Error('Unauthorized') — vừa giữ đúng mã 401 khi nổi lên filter,
// vừa phân biệt được token sai cấu trúc / sai chữ ký / hết hạn để debug.
export function verifyJwt(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Invalid token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(signatureInput)
    .digest('base64url');

  // So sánh chống timing attack — phải khớp độ dài trước khi timingSafeEqual.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new UnauthorizedException('Invalid signature');
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8'),
    );
  } catch {
    throw new UnauthorizedException('Malformed token payload');
  }

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new UnauthorizedException('Token expired');
  }

  return payload;
}

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      // Thiếu `return` ở đây: khi err set, derivedKey undefined →
      // derivedKey.toString() ném TypeError trong callback libuv → crash process.
      if (err) return reject(err);
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
      if (err) return reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}
