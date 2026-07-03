import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json();
    
    if (!token || !action) {
       return NextResponse.json({ message: 'Token and action are required' }, { status: 400 });
    }

    // Forward the request to the api-core backend (global prefix is /api).
    const apiUrl = process.env.API_CORE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, action }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Payment confirmation failed on server' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Payment confirm error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
