import { createAuthClient } from 'better-auth/react';

/**
 * Customer Auth Client — dành cho Storefront.
 *
 * Kết nối tới endpoint /api/auth/customer/* của api-core.
 * Tách biệt hoàn toàn với Owner auth để đảm bảo multi-tenancy.
 *
 * Cách dùng trong component:
 *   const { data: session, isPending } = customerAuthClient.useSession();
 *   await customerAuthClient.signIn.email({ email, password });
 */
export const customerAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/customer`
    : 'http://localhost:3000/api/auth/customer',
  fetchOptions: {
    credentials: 'include',
    headers: {
      'x-auth-type': 'customer',
    },
  },
});

// Export các hook và helpers thường dùng
export const {
  signIn: customerSignIn,
  signUp: customerSignUp,
  signOut: customerSignOut,
  useSession: useCustomerSession,
  getSession: getCustomerSession,
} = customerAuthClient;

// Kiểu dữ liệu session của Customer
export type CustomerSession = typeof customerAuthClient.$Infer.Session;
