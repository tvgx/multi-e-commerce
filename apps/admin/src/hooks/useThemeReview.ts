import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';

export interface ReviewTheme {
  themeId: string;
  title: string;
  description?: string;
  category?: string;
  status: 'draft' | 'pending' | 'published';
  previewImageUrl?: string;
  ownerShopId?: string;
  review?: { rejectionReason?: string; submittedAt?: string };
}

export type ThemeReviewTab = 'pending' | 'published';

/**
 * Logic dữ liệu cho trang duyệt Theme Market (platform admin):
 * tải danh sách theo tab, duyệt, từ chối. Trang chỉ giữ state tab + JSX.
 */
export function useThemeReview(tab: ThemeReviewTab) {
  const [themes, setThemes] = useState<ReviewTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (which: ThemeReviewTab) => {
    setLoading(true);
    try {
      const url =
        which === 'pending'
          ? '/api/themes/admin/review?status=pending'
          : '/api/themes?status=published';
      const res = await apiClient.get<ReviewTheme[]>(url);
      setThemes(res.data || []);
    } catch (err: any) {
      toast.error(`Không tải được danh sách: ${err.message}`);
      setThemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const approve = useCallback(async (themeId: string) => {
    if (!(await confirmDialog({ message: 'Duyệt và đưa theme này lên chợ?' }))) return;
    setBusy(themeId);
    try {
      await apiClient.patch(`/api/themes/${themeId}/publish`, {});
      toast.success('Đã duyệt và xuất bản theme.');
      setThemes((t) => t.filter((x) => x.themeId !== themeId));
    } catch (err: any) {
      toast.error(`Duyệt thất bại: ${err.message}`);
    } finally {
      setBusy(null);
    }
  }, []);

  const reject = useCallback(async (themeId: string) => {
    const reason = window.prompt('Lý do từ chối (gửi lại cho người bán):', '');
    if (reason === null) return;
    setBusy(themeId);
    try {
      await apiClient.patch(`/api/themes/${themeId}/reject`, { reason });
      toast.success('Đã từ chối theme.');
      setThemes((t) => t.filter((x) => x.themeId !== themeId));
    } catch (err: any) {
      toast.error(`Từ chối thất bại: ${err.message}`);
    } finally {
      setBusy(null);
    }
  }, []);

  return { themes, loading, busy, reload: () => load(tab), approve, reject };
}
