import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMyOrders, getShopInfo, getMyProfile, getShopPageLayout } from '@/lib/api/storefront.api';
import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { StandardProfile } from '@ecommerce/ui-registry/src/components/pages/StandardProfile';
import { logoutCustomer } from '@/app/actions/auth.actions';

export default async function ProfilePage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = await params;

    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;

    if (!token) {
        redirect(`/${shopSlug}/account/login`);
    }

    const [shopInfo, profile, orders, pageLayout] = await Promise.all([
        getShopInfo(shopSlug),
        getMyProfile(shopSlug, token),
        getMyOrders(shopSlug, token),
        getShopPageLayout(shopSlug, 'profile'),
    ]);

    // Sign-out must clear the httpOnly cookie server-side; the section receives
    // this bound server action through pageContext.
    async function signOutAction() {
        'use server';
        await logoutCustomer(shopSlug);
        redirect(`/${shopSlug}/account/login`);
    }

    const pageContext = { shopInfo, shopSlug, profile, orders, signOutAction };

    if (pageLayout) {
        return <LayoutRenderer pageLayout={pageLayout} pageContext={pageContext} />;
    }

    // No builder layout yet — render the standard account page directly.
    return (
        <StandardProfile
            shopSlug={shopSlug}
            profile={profile}
            orders={orders}
            signOutAction={signOutAction}
        />
    );
}
