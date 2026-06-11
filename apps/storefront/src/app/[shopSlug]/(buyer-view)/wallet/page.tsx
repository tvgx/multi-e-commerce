import React from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getShopInfo } from '@/lib/api/storefront.api';
import { WalletClient } from '@/components/wallet/WalletClient';

export default async function WalletPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;

    if (!token) {
        redirect(`/${shopSlug}/account/login`);
    }

    const shopInfo = await getShopInfo(shopSlug);
    if (!shopInfo) return notFound();

    return <WalletClient shopInfo={shopInfo} shopSlug={shopSlug} />;
}
