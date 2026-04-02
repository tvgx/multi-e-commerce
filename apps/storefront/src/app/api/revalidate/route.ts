/**
 * Next.js On-Demand ISR Revalidation Route Handler
 *
 * Called by NestJS api-core after a layout sync.
 * POST /api/revalidate?tag=layout-{shopId}&secret=<REVALIDATE_SECRET>
 *
 * Env required:
 *   REVALIDATE_SECRET — must match the value in api-core's REVALIDATE_SECRET
 */

import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const secret = searchParams.get('secret');

    // Validate secret
    const expectedSecret = process.env.REVALIDATE_SECRET ?? 'dev_secret';
    if (secret !== expectedSecret) {
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (!tag) {
        return NextResponse.json({ error: 'tag param is required' }, { status: 400 });
    }

    revalidateTag(tag, { expire: 0 });

    return NextResponse.json({
        revalidated: true,
        tag,
        now: Date.now(),
    });
}
