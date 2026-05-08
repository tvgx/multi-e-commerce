import { createAuthClient } from 'better-auth/react';

/**
 * Owner Auth Client — dành cho Admin Dashboard.
 *
 * Kết nối tới endpoint /api/auth/owner/* của api-core.
 * Sử dụng cho các tác vụ: signIn, signUp, signOut, getSession.
 *
 * Cách dùng trong component:
 *   const { data: session, isPending } = authClient.useSession();
 *   await authClient.signIn.email({ email, password });
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/owner`
    : 'http://localhost:3000/api/auth/owner',
  fetchOptions: {
    // Gửi cookie trong mọi request để session hoạt động
    credentials: 'include',
    headers: {
      'x-auth-type': 'owner',
    },
  },
});

// Export các hook và helpers thường dùng
export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Kiểu dữ liệu session của Owner
export type OwnerSession = typeof authClient.$Infer.Session;
