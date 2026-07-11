import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMyOrders, getShopInfo, getMyProfile } from '@/lib/api/storefront.api';
import { StandardProfile } from '@ecommerce/ui-registry/src/components/pages/StandardProfile';
import { logoutCustomer } from '@/app/actions/auth.actions';

// Trang tài khoản cố ý KHÔNG render layout builder — luôn dùng StandardProfile
// để luồng tài khoản ổn định, người bán không tùy chỉnh được (TODO 21).
export default async function ProfilePage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = await params;

    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;

    if (!token) {
        redirect(`/${shopSlug}/account/login`);
    }

    const [shopInfo, profile, orders] = await Promise.all([
        getShopInfo(shopSlug),
        getMyProfile(shopSlug, token),
        getMyOrders(shopSlug, token),
    ]);

    // Sign-out must clear the httpOnly cookie server-side.
    async function signOutAction() {
        'use server';
        await logoutCustomer(shopSlug);
        redirect(`/${shopSlug}/account/login`);
    }

    return (
        <StandardProfile
            shopSlug={shopSlug}
            profile={profile}
            orders={orders}
            signOutAction={signOutAction}
        />
    );
}
