/**
 * /api/storage/upload — Server-side proxy route
 *
 * Vấn đề: Browser không gửi được cookie cross-origin (admin:3001 → api:3000)
 * Giải pháp: Next.js API Route chạy phía server, đọc cookie từ request
 *           rồi forward lên NestJS kèm cookie đó.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Đọc cookie hiện tại của user (server-side, không bị CORS block)
    const cookieHeader = request.headers.get('cookie') || '';
    const shopId = request.headers.get('x-shop-id') || '';

    // Lấy type từ query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'product';

    // Lấy FormData từ request
    const formData = await request.formData();

    // Determine nếu là batch (có key 'files') hay single (có key 'file')
    const hasBatch = formData.has('files');
    const endpoint = hasBatch
      ? `${API_URL}/storage/upload/batch?type=${type}`
      : `${API_URL}/storage/upload?type=${type}`;

    // Forward request lên NestJS với cookie đầy đủ
    const forwardHeaders: HeadersInit = {
      cookie: cookieHeader,
      'x-auth-type': 'owner',
    };
    if (shopId) {
      forwardHeaders['x-shop-id'] = shopId;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: forwardHeaders,
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[StorageProxy] Upload failed:', error);
    return NextResponse.json(
      { code: '5000', message: 'Internal proxy error', data: null },
      { status: 500 },
    );
  }
}
