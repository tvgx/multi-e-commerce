'use server';
import { cookies } from 'next/headers';
import { resolveShopContext } from '@/lib/api/storefront.api';

const API_BASE_URL = process.env.API_CORE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function loginCustomer(shopSlug: string, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const resolvedShop = await resolveShopContext(shopSlug);
        if (!resolvedShop?.id) {
            return { error: 'Shop not found' };
        }

        const shopId = resolvedShop.id;

        const res = await fetch(`${API_BASE_URL}/api/storefront-auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-shop-id': shopId,
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            return { error: data.message || 'Login failed' };
        }

        const token = data.data?.token || data.data?.accessToken;

        if (token) {
            // Set cookie for the specific shop slug path
            const cookieStore = await cookies();
            cookieStore.set(`shop_session_${shopSlug}`, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: `/${shopSlug}`,
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            // Merge any anonymous (guest) cart into this customer's cart, then
            // drop the guest token so it isn't reused. Non-fatal on failure.
            const guestToken = cookieStore.get(`cart_token_${shopSlug}`)?.value;
            if (guestToken) {
                try {
                    await fetch(`${API_BASE_URL}/api/cart/merge`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-shop-id': shopId,
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ guestToken }),
                    });
                } catch (mergeErr) {
                    console.error('Guest cart merge failed:', mergeErr);
                }
                cookieStore.delete(`cart_token_${shopSlug}`);
            }

            return { success: true };
        }

        return { error: 'No token received' };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Internal server error' };
    }
}

export async function registerCustomer(shopSlug: string, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    try {
        const resolvedShop = await resolveShopContext(shopSlug);
        if (!resolvedShop?.id) {
            return { error: 'Shop not found' };
        }

        const shopId = resolvedShop.id;

        const res = await fetch(`${API_BASE_URL}/api/storefront-auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-shop-id': shopId,
            },
            body: JSON.stringify({ email, password, fullName }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            return { error: data.message || 'Registration failed' };
        }

        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Internal server error' };
    }
}

export async function logoutCustomer(shopSlug: string) {
    const cookieStore = await cookies();
    cookieStore.delete(`shop_session_${shopSlug}`);
}

export async function getCustomerSession(shopSlug: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;
    return token ? token : null;
}

export async function getCustomerData(shopSlug: string) {
    const token = await getCustomerSession(shopSlug);
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        return payload; // { sub: 'customerId', ... }
    } catch (e) {
        return null;
    }
}
