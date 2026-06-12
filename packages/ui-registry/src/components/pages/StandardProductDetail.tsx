'use client';

import React, { useState } from 'react';
import { Star, Minus, Plus, ShoppingCart, Heart, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { AddToCartButton } from '../cart/AddToCartButton';
import { SmartImage } from '../blocks/SmartImage';
import { formatPrice } from '../../lib/format';

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
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(product?.images?.[0] || '');
    
    // Fallback if no product is passed
    if (!product) return <div className="text-center py-20 text-slate-500">Product not found.</div>;

    const defaultVariant = product.variants?.[0] || { id: 'default', sku: 'DEFAULT', price: product.basePrice, stockItems: [] };
    const price = defaultVariant.price || product.basePrice;
    
    const totalStock = (defaultVariant.stockItems || []).reduce(
        (sum, item) => sum + (item.countOnHand || 0), 0
    );
    const inStock = totalStock > 0 || !defaultVariant.stockItems; // Assume in stock if tracking is off for now

    return (
        <div className="w-full bg-slate-50 min-h-screen pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Breadcrumbs */}
                <div className="text-sm text-slate-500 mb-8 flex items-center gap-2">
                    <a href="/" className="hover:text-primary transition-colors">Home</a>
                    <span>/</span>
                    <a href="/collections/all" className="hover:text-primary transition-colors">{product.category || 'Shop'}</a>
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
                            <button className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md rounded-full text-slate-600 hover:text-red-500 hover:bg-white transition-all shadow-sm">
                                <Heart className="w-5 h-5" />
                            </button>
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
                                        <SmartImage src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" sizes="96px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">{product.name}</h1>
                        
                        {/* Reviews */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <span className="text-slate-500 text-sm">(128 reviews)</span>
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

                        {/* Quantity */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-700 mb-3">Quantity</label>
                            <div className="flex items-center w-32 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <div className="flex-1 text-center font-medium text-slate-900">{quantity}</div>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
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
                                className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-xl font-medium text-lg shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Add to Cart
                            </AddToCartButton>
                            <button className="flex-1 bg-primary text-white hover:bg-primary/90 py-4 rounded-xl font-medium text-lg shadow-md transition-all">
                                Buy It Now
                            </button>
                        </div>

                        {/* Value Props */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto pt-6 border-t border-slate-100">
                            <div className="flex flex-col items-center text-center gap-2">
                                <Truck className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium text-slate-600">Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium text-slate-600">2-Year Warranty</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <RefreshCcw className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium text-slate-600">30-Day Returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">You May Also Like</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((rp, idx) => (
                                <a key={idx} href={`/products/${rp.id}`} className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 transition-all">
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
