import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getWishlist, getShopInfo } from '@/lib/api/storefront.api';
import Link from 'next/link';
import { SmartImage } from '@ecommerce/ui-registry/src/components/blocks/SmartImage';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';
import { getT, getLocale } from '@/lib/i18n';

export default async function WishlistPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = await params;

    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;

    if (!token) {
        redirect(`/${shopSlug}/account/login?redirect=/${shopSlug}/wishlist`);
    }

    const shopInfo = await getShopInfo(shopSlug);
    const wishlist = await getWishlist(shopSlug, token);
    const t = await getT('shop');
    const tc = await getT('common');
    const locale = await getLocale();

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold text-slate-900">{t('wishlist.pageTitle')}</h1>

            {(!wishlist || wishlist.length === 0) ? (
                <div className="bg-slate-50 text-slate-500 p-12 rounded-2xl text-center border border-slate-200">
                    <div className="text-4xl mb-4">💔</div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">{t('wishlist.empty')}</h2>
                    <p className="mb-6">{t('wishlist.emptyDescription')}</p>
                    <Link href={`/${shopSlug}`} className="inline-block px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors">
                        {tc('buttons.continueShopping')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.filter((item: any) => item.product).map((item: any) => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <Link href={`/${shopSlug}/products/${item.product.id}`} className="block relative aspect-square bg-slate-100 overflow-hidden">
                                {item.product.imageUrl ? (
                                    <SmartImage
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(min-width: 768px) 25vw, 50vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        {tc('messages.noImage')}
                                    </div>
                                )}
                            </Link>
                            <div className="p-4">
                                <Link href={`/${shopSlug}/products/${item.product.id}`} className="block">
                                    <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.product.name}</h3>
                                </Link>
                                <div className="mt-2 text-lg font-bold text-slate-900">
                                    {formatPrice(Number(item.product.variants?.[0]?.price ?? 0), { locale })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
