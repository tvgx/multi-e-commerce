'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { AddToCartButton } from '../cart/AddToCartButton';
import { WishlistButton } from '../products/WishlistButton';
import { ProductReviews } from '../products/ProductReviews';
import { SmartImage } from '../blocks/SmartImage';
import { usePriceFormatter } from '../../lib/use-price';
import { useShopBase, shopHref } from '../../lib/use-shop-base';
import { useCartStore } from '../../store/cart-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    title?: string;
    stockItems?: { countOnHand?: number }[];
    attributes?: Record<string, string>;
}

interface Product {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    images: string[];
    variants: ProductVariant[];
    category?: string;
}

interface StandardProductDetailProps {
    product: Product;
    relatedProducts?: Product[];
}

export function StandardProductDetail({ product, relatedProducts = [] }: StandardProductDetailProps) {
    const t = useTranslations('shop');
    const tv = useTranslations('validation');
    const formatPrice = usePriceFormatter();
    const base = useShopBase();
    const router = useRouter();

    const [quantity, setQuantity] = useState(1);
    const [quantityError, setQuantityError] = useState<string | null>(null);
    const [quantityText, setQuantityText] = useState('1');
    const [activeImage, setActiveImage] = useState(product?.images?.[0] || '');
    const [buying, setBuying] = useState(false);

    const defaultVariant = useMemo(
        () => product?.variants?.[0] || { id: 'default', sku: 'DEFAULT', price: product?.basePrice ?? 0, stockItems: [] as { countOnHand?: number }[] },
        [product],
    );

    // Fallback if no product is passed
    if (!product) return <div className="text-center py-20 text-slate-500">{t('products.notFound')}</div>;

    const price = defaultVariant.price || product.basePrice;

    // TODO 8: max theo tồn kho của variant. stockItems rỗng/không có = không
    // theo dõi kho → không giới hạn (maxQty undefined).
    const tracked = Array.isArray(defaultVariant.stockItems) && defaultVariant.stockItems.length > 0;
    const totalStock = (defaultVariant.stockItems || []).reduce(
        (sum, item) => sum + (item.countOnHand || 0), 0
    );
    const maxQty = tracked ? totalStock : undefined;
    const inStock = !tracked || totalStock > 0;

    // Cho phép gõ số trực tiếp; guard int >= 1 và <= tồn kho, báo lỗi ngay dưới ô.
    const applyQuantity = (raw: string) => {
        setQuantityText(raw);
        const trimmed = raw.trim();
        if (trimmed === '') { setQuantityError(tv('number')); return; }
        const n = Number(trimmed);
        if (!Number.isFinite(n) || !/^\d+$/.test(trimmed)) {
            setQuantityError(tv('number'));
            return;
        }
        if (!Number.isInteger(n) || n < 1) {
            setQuantityError(tv('integer'));
            return;
        }
        if (maxQty != null && n > maxQty) {
            setQuantityError(t('products.exceedStock', { count: maxQty }));
            return;
        }
        setQuantityError(null);
        setQuantity(n);
    };

    const stepQuantity = (delta: number) => {
        const next = Math.max(1, quantity + delta);
        const clamped = maxQty != null ? Math.min(next, Math.max(1, maxQty)) : next;
        setQuantity(clamped);
        setQuantityText(String(clamped));
        setQuantityError(null);
    };

    const canPurchase = inStock && !quantityError;

    const buyNow = async () => {
        if (!canPurchase || buying) return;
        setBuying(true);
        try {
            // Thêm vào giỏ rồi chuyển thẳng tới trang thanh toán.
            await useCartStore.getState().addItem({
                productId: product.id,
                variantId: defaultVariant.id,
                price,
                title: product.name,
                imageUrl: activeImage,
                quantity,
            });
            router.push(`${base}/payment`);
        } finally {
            setBuying(false);
        }
    };

    return (
        <div className="w-full bg-slate-50 min-h-screen pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Breadcrumbs */}
                <div className="text-sm text-slate-500 mb-8 flex items-center gap-2">
                    <a href={base || '/'} className="hover:text-primary transition-colors">{t('header.home')}</a>
                    <span>/</span>
                    <a href={shopHref(base, '/all-products')} className="hover:text-primary transition-colors">{product.category || t('header.allProducts')}</a>
                    <span>/</span>
                    <span className="text-slate-900 font-medium truncate">{product.name}</span>
                </div>

                {/* Main Product Area */}
                <div className="flex flex-col lg:flex-row gap-12 mb-20 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">

                    {/* Left: Image Gallery */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
                            {activeImage ? (
                                <SmartImage src={activeImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 50vw, 100vw" priority />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">🛍️</div>
                            )}
                            {/* TODO 6: nút yêu thích thật (wishlist) thay cho nút tim chết */}
                            <div className="absolute top-4 right-4">
                                <WishlistButton productId={product.id} className="bg-white/80 backdrop-blur-md shadow-sm" />
                            </div>
                        </div>
                        {/* Thumbnail Strip */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-primary shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <SmartImage src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" sizes="96px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">{product.name}</h1>

                        {/* Stock status */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                {inStock ? t('products.inStock') : t('products.outOfStock')}
                            </span>
                            {tracked && inStock && (
                                <span className="text-xs text-slate-400">{t('products.stockLeft', { count: totalStock })}</span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="text-3xl font-light text-slate-900 mb-8">
                            {formatPrice(price)}
                        </div>

                        {/* Description Extract */}
                        <div className="prose prose-slate mb-8 text-slate-600 leading-relaxed">
                            <p>{product.description}</p>
                        </div>

                        <hr className="border-slate-100 mb-8" />

                        {/* Quantity — cho nhập số trực tiếp + guard tồn kho (TODO 8) */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-700 mb-3">{t('products.quantity')}</label>
                            <div className="flex items-center w-40 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                <button onClick={() => stepQuantity(-1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors" aria-label="-">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={quantityText}
                                    onChange={(e) => applyQuantity(e.target.value)}
                                    aria-invalid={!!quantityError}
                                    className="flex-1 w-full text-center font-medium text-slate-900 bg-transparent outline-none"
                                />
                                <button onClick={() => stepQuantity(1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors" aria-label="+">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {quantityError && (
                                <p role="alert" className="mt-2 text-xs text-red-500">{quantityError}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <AddToCartButton
                                productId={product.id}
                                variantId={defaultVariant.id}
                                price={price}
                                title={product.name}
                                imageUrl={activeImage}
                                quantity={quantity}
                                className={`flex-1 bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-medium text-lg shadow-md transition-all flex items-center justify-center gap-2 ${!canPurchase ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {t('products.addToCart')}
                            </AddToCartButton>
                            <button
                                onClick={buyNow}
                                disabled={!canPurchase || buying}
                                className="flex-1 bg-primary text-white hover:bg-primary/90 py-4 rounded-xl font-medium text-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {buying ? t('products.adding') : t('products.buyNow')}
                            </button>
                        </div>

                        {/* Value Props */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto pt-6 border-t border-slate-100">
                            <div className="flex flex-col items-center text-center gap-2">
                                <Truck className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium text-slate-600">{t('products.freeShipping')}</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium text-slate-600">{t('products.warranty')}</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <RefreshCcw className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium text-slate-600">{t('products.returns')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews — data thật từ /interactions/reviews (TODO 1, 2) */}
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
                    <ProductReviews productId={product.id} />
                </div>

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">{t('products.relatedProducts')}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((rp, idx) => (
                                <a key={idx} href={shopHref(base, `/products/${rp.id}`)} className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 transition-all">
                                    <div className="aspect-square bg-slate-50 rounded-xl mb-4 overflow-hidden">
                                        <SmartImage src={rp.images?.[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 768px) 25vw, 50vw" />
                                    </div>
                                    <h3 className="font-medium text-slate-900 mb-1 truncate">{rp.name}</h3>
                                    <div className="text-primary font-semibold">{formatPrice(rp.basePrice)}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
