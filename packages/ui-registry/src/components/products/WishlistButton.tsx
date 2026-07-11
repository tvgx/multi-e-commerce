'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useShopBase } from '../../lib/use-shop-base';
import { useTranslations } from '@ecommerce/i18n/src/react';

interface WishlistButtonProps {
    productId: string;
    initialIsWishlisted?: boolean;
    className?: string;
}

/**
 * Nút yêu thích (TODO 6) — gọi API thật POST /interactions/wishlist/toggle qua
 * BFF (`/{shopSlug}/api/store/...` tự gắn Bearer token từ cookie httpOnly).
 * Chưa đăng nhập (401) → chuyển tới trang đăng nhập của shop.
 */
export function WishlistButton({ productId, initialIsWishlisted = false, className = '' }: WishlistButtonProps) {
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [loading, setLoading] = useState(false);
    const base = useShopBase();
    const router = useRouter();
    const t = useTranslations('shop');

    const toggleWishlist = async (e: React.MouseEvent) => {
        // Nút thường nằm đè trên card <a> — chặn điều hướng của thẻ cha.
        e.preventDefault();
        e.stopPropagation();
        if (!base) return; // builder canvas — không có shop context
        setLoading(true);
        try {
            const res = await fetch(`${base}/api/store/interactions/wishlist/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            });
            if (res.status === 401) {
                router.push(`${base}/account/login`);
                return;
            }
            if (res.ok) {
                const body = await res.json();
                // API trả { status: 'added'|'removed' } (không bọc BaseResponseDto).
                const status = body?.status ?? body?.data?.status;
                setIsWishlisted(status ? status === 'added' : !isWishlisted);
            }
        } catch (e) {
            console.error('Wishlist toggle failed', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={loading}
            className={`p-3 rounded-full border transition-all flex items-center justify-center
                ${isWishlisted
                    ? 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
            aria-label={isWishlisted ? t('products.removeFromWishlist') : t('products.addToWishlist')}
        >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
    );
}
