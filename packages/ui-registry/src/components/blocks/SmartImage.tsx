'use client';

import React, { useState } from 'react';
import { CDN_BASE, DEFAULT_IMG, PLACEHOLDER_DATA_URI } from '../../lib/media';

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
const MEDIA_ORIGINS = (process.env.NEXT_PUBLIC_MEDIA_ORIGINS || CDN_BASE)
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

const DEFAULT_FALLBACK = DEFAULT_IMG;
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
    style,
    ...rest
}: SmartImageProps) {
    // Track failures per-URL so slideshows that swap `src` recover automatically,
    // and so the chain src → fallbackSrc → placeholder advances đúng một nấc mỗi lỗi.
    const [failedSrcs, setFailedSrcs] = useState<ReadonlySet<string>>(new Set());

    // Nấc cuối là data-URI trong codebase — không bao giờ hỏng vì mạng/CDN.
    const chain = [src, fallbackSrc, PLACEHOLDER_DATA_URI].filter(
        (u, i, arr): u is string => !!u && arr.indexOf(u) === i,
    );
    const effectiveSrc = chain.find((u) => !failedSrcs.has(u)) ?? PLACEHOLDER_DATA_URI;
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
            onError={() =>
                setFailedSrcs((prev) => {
                    if (prev.has(effectiveSrc)) return prev;
                    const next = new Set(prev);
                    next.add(effectiveSrc);
                    return next;
                })
            }
            // Placeholder hiển thị làm nền TRƯỚC khi ảnh tải xong; ảnh thật vẽ đè
            // lên khi load (TODO 10). Không bọc wrapper để khỏi phá layout fill/cover.
            style={{
                backgroundImage: `url("${PLACEHOLDER_DATA_URI}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                ...style,
            }}
            {...rest}
        />
    );
}
