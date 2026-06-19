import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useOnboarding } from '@/hooks/useOnboarding';

/**
 * Logic dữ liệu cho trang xác thực tên miền: đọc trạng thái onboarding (domain)
 * và kích hoạt build nền. Trang chỉ giữ UI (hiển thị bản ghi DNS, copy, redirect).
 */
export function useDomainVerification(shopId: string) {
  const { status, refresh } = useOnboarding(shopId);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Kích hoạt build nền. Trả về true nếu gửi thành công (trang sẽ redirect). */
  const verify = async (): Promise<boolean> => {
    setVerifying(true);
    setError(null);
    try {
      await apiClient.post(`/api/shops/${shopId}/build`, {}, { shopId });
      return true;
    } catch (err: any) {
      setError(err.message || 'DNS verification failed. Please check your records and try again.');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return { domain: status?.domain ?? null, refresh, verifying, error, verify };
}
