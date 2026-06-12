"use client";

import React from "react";
import { StandardCart } from "@ecommerce/ui-registry/src/components/pages/StandardCart";
import { useCartStore } from "@/store/cart-store";

/**
 * The cart is a fixed (non-customisable) page. This thin client wrapper feeds
 * the live cart-store contents into the standard cart layout so the full-page
 * cart always renders real items without depending on a saved layout.
 */
export function CartPageClient() {
    const items = useCartStore((s) => s.items);

    const mapped = items.map((it) => ({
        id: `${it.productId}-${it.variantId}`,
        productId: it.productId,
        name: it.title || "Sản phẩm",
        variant: it.variantId,
        price: it.price,
        quantity: it.quantity,
        image: it.imageUrl || "",
    }));

    return <StandardCart items={mapped} />;
}
