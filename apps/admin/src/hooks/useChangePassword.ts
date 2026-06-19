import { useState } from 'react';

/**
 * Logic đổi mật khẩu owner. Dùng raw fetch (không qua apiClient) vì cần gửi
 * cookie session owner + header x-auth-type cho better-auth (AUTH-1). Trang chỉ
 * giữ form + thông báo thành công + điều hướng.
 */
export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** Trả về true nếu đổi mật khẩu thành công (trang hiện thông báo + redirect). */
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        // AUTH-1: credentials:'include' để gửi cookie session owner — thiếu nó
        // BE không có session, đổi mật khẩu luôn fail.
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-auth-type': 'owner' },
        body: JSON.stringify({ newPassword, currentPassword, revokeOtherSessions: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Change password failed');
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { changePassword, loading, error };
}
