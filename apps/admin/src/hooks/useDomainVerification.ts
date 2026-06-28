import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface DomainVerificationRecord {
  type: string; // 'TXT'
  host: string; // '@'
  value: string; // shopVolo-verification=<shopId>
}

/**
 * Logic dữ liệu cho trang Xác thực Tên miền (P0-2 — xác thực THẬT).
 *
 * - `load`: đọc customDomain + domainVerified hiện tại của shop.
 * - `saveDomain`: lưu tên miền riêng, trả về bản ghi TXT cần thêm vào DNS.
 * - `verify`: gọi backend resolve bản ghi TXT thật rồi đối chiếu.
 */
export function useDomainVerification(shopId: string) {
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [domainVerified, setDomainVerified] = useState(false);
  const [record, setRecord] = useState<DomainVerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>(`/api/shops/${shopId}`);
      const shop = res.data;
      setCustomDomain(shop?.customDomain ?? null);
      setDomainVerified(!!shop?.domainVerified);
      // Nếu đã có tên miền nhưng chưa xác thực, dựng lại bản ghi TXT để hiển thị.
      if (shop?.customDomain && !shop?.domainVerified) {
        setRecord({ type: 'TXT', host: '@', value: `shopVolo-verification=${shopId}` });
      }
    } catch (err: any) {
      setError(err.message || 'Không tải được thông tin tên miền');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Lưu tên miền riêng; trả về bản ghi TXT cần thêm (hoặc null nếu lỗi). */
  const saveDomain = async (
    domain: string,
  ): Promise<DomainVerificationRecord | null> => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.patch<any>(
        `/api/shops/${shopId}/domain`,
        { customDomain: domain },
        { shopId },
      );
      const data = res.data;
      setCustomDomain(data?.customDomain ?? domain);
      setDomainVerified(!!data?.domainVerified);
      setRecord(data?.verification ?? null);
      return data?.verification ?? null;
    } catch (err: any) {
      setError(err.message || 'Lưu tên miền thất bại');
      return null;
    } finally {
      setSaving(false);
    }
  };

  /** Xác thực thật qua bản ghi TXT. Trả về true nếu đã xác thực. */
  const verify = async (): Promise<boolean> => {
    setVerifying(true);
    setError(null);
    try {
      const res = await apiClient.post<any>(
        `/api/shops/${shopId}/domain/verify`,
        {},
        { shopId },
      );
      const verified = !!res.data?.domainVerified;
      setDomainVerified(verified);
      return verified;
    } catch (err: any) {
      setError(
        err.message ||
          'Xác thực thất bại. Vui lòng kiểm tra lại bản ghi DNS và thử lại.',
      );
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return {
    customDomain,
    domainVerified,
    record,
    loading,
    saving,
    verifying,
    error,
    saveDomain,
    verify,
    refresh: load,
  };
}
