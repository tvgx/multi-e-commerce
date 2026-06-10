'use client';

import React, { useState } from 'react';

/**
 * SmartImage — drop-in replacement for `<img>` across section components.
 *
 * - Routes storage-hosted images through imgproxy (resize + on-the-fly
 *   WebP/AVIF) and emits a responsive `srcSet`.
 * - Lazy-loads below-the-fold images by default; pass `priority` for
 *   above-the-fold media (hero banners, slideshows).
 * - Handles broken images internally via `fallbackSrc`, so server components
 *   no longer need inline `onError` handlers (which are invalid in RSC).
 *
 * Proxying only applies to origins listed in NEXT_PUBLIC_MEDIA_ORIGINS
 * (comma-separated, defaults to the local MinIO endpoint). imgproxy resolves
 * the image path against IMGPROXY_BASE_URL inside the docker network, so only
 * same-storage URLs can be rewritten — external URLs are left untouched.
 */

const PROXY_BASE = process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || '';
const MEDIA_ORIGINS = (process.env.NEXT_PUBLIC_MEDIA_ORIGINS || 'http://localhost:9000')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

const DEFAULT_FALLBACK = 'http://localhost:9000/assets/default-component.png';
const SRCSET_WIDTHS = [384, 640, 960, 1280, 1920];

function proxyablePath(src: string): string | null {
    if (!PROXY_BASE || !src.startsWith('http')) return null;
    try {
        const url = new URL(src);
        return MEDIA_ORIGINS.includes(url.origin) ? url.pathname : null;
    } catch {
        return null;
    }
}

function proxied(path: string, width: number, quality: number): string {
    return `${PROXY_BASE}/unsafe/rs:fit:${width}:0/q:${quality}/plain${path}`;
}

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    /** Image shown when `src` is missing or fails to load. */
    fallbackSrc?: string;
    /** Set for above-the-fold images (hero/slideshow) to avoid hurting LCP. */
    priority?: boolean;
    quality?: number;
}

export function SmartImage({
    src,
    fallbackSrc = DEFAULT_FALLBACK,
    priority = false,
    quality = 80,
    sizes = '100vw',
    alt = '',
    ...rest
}: SmartImageProps) {
    // Track failure per-src so slideshows that swap `src` recover automatically.
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const failed = failedSrc !== null && failedSrc === src;
    const effectiveSrc = (!src || failed) ? fallbackSrc : src;
    const path = proxyablePath(effectiveSrc);

    return (
        <img
            src={path ? proxied(path, 1280, quality) : effectiveSrc}
            srcSet={path ? SRCSET_WIDTHS.map((w) => `${proxied(path, w, quality)} ${w}w`).join(', ') : undefined}
            sizes={path ? sizes : undefined}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            onError={() => setFailedSrc(src ?? null)}
            {...rest}
        />
    );
}
