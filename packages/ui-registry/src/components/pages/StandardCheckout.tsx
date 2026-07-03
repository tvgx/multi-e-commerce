'use client';

import React from 'react';
import { CheckoutDefault } from '../cart/CheckoutDefault';

interface StandardCheckoutProps {
    shopInfo?: any;
    shopSlug?: string;
}

/**
 * StandardCheckout is kept in the component registry for master-template
 * layouts, but it now delegates to the single, real checkout implementation
 * (CheckoutDefault) instead of maintaining a second, divergent checkout that
 * posted to a stale API contract. This keeps one working checkout everywhere.
 */
export function StandardCheckout({ shopInfo, shopSlug }: StandardCheckoutProps) {
    if (!shopInfo || !shopSlug) return null;
    return <CheckoutDefault shopInfo={shopInfo} shopSlug={shopSlug} />;
}
