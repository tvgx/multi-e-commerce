'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
    productId: string;
    initialIsWishlisted?: boolean;
    className?: string;
}

export function WishlistButton({ productId, initialIsWishlisted = false, className = '' }: WishlistButtonProps) {
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [loading, setLoading] = useState(false);

    const toggleWishlist = async () => {
        setLoading(true);
        // In a real implementation, this would call an API
        // For now, we just mock the toggle
        setTimeout(() => {
            setIsWishlisted(!isWishlisted);
            setLoading(false);
        }, 500);
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
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
    );
}
