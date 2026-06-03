import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json();
    
    if (!token || !action) {
       return NextResponse.json({ message: 'Token and action are required' }, { status: 400 });
    }

    // Forward the request to the api-core backend
    // Assume NEXT_PUBLIC_API_URL is configured
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // We need to send it to the correct endpoint in api-core
    // Wait, the api-core payment controller endpoint is not yet fully defined? Let's check.
    // Assuming POST /payments/confirm
    const res = await fetch(`${apiUrl}/payments/confirm`, {
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
