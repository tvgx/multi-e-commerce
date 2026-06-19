import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';

export interface MyTheme {
  themeId: string;
  title: string;
  description?: string;
  category?: string;
  status: 'draft' | 'pending' | 'published';
  previewImageUrl?: string;
  review?: { rejectionReason?: string };
}

export interface FigmaImportInput {
  fileKey: string;
  title: string;
  category: string;
}

// Extraction runs Claude per frame on the server and can take minutes. Bound the
// request so the browser can't hang forever (THEME-1); keep it a touch longer than
// api-core's own timeout so its clearer message wins on overrun.
const FIGMA_IMPORT_CLIENT_TIMEOUT_MS = 5 * 60_000;

/**
 * Logic dữ liệu cho trang "Theme của tôi": tải danh sách, gửi duyệt, xoá (kèm
 * confirmDialog), áp dụng vào shop, import từ Figma (kèm timeout). Trang chỉ giữ
 * form Figma + JSX; các hành động trả về boolean để trang tự điều hướng/reset.
 */
export function useMyThemes(shopId: string) {
  const [themes, setThemes] = useState<MyTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<MyTheme[]>('/api/themes/mine');
      setThemes(res.data || []);
    } catch (err: any) {
      toast.error(`Không tải được theme: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async (themeId: string) => {
    setBusy(themeId);
    try {
      await apiClient.patch(`/api/themes/${themeId}/submit`, {});
      toast.success('Đã gửi duyệt. Admin sẽ xem xét theme của bạn.');
      load();
    } catch (err: any) {
      toast.error(`Gửi duyệt thất bại: ${err.message}`);
    } finally {
      setBusy(null);
    }
  }, [load]);

  const remove = useCallback(async (themeId: string) => {
    if (!(await confirmDialog({ message: 'Xoá theme này?', danger: true }))) return;
    setBusy(themeId);
    try {
      await apiClient.delete(`/api/themes/${themeId}`);
      toast.success('Đã xoá theme.');
      setThemes((t) => t.filter((x) => x.themeId !== themeId));
    } catch (err: any) {
      toast.error(`Xoá thất bại: ${err.message}`);
    } finally {
      setBusy(null);
    }
  }, []);

  /** Áp dụng theme vào shop. Trả về true nếu thành công (trang mở builder). */
  const apply = useCallback(async (themeId: string): Promise<boolean> => {
    setBusy(themeId);
    try {
      await apiClient.post(`/api/themes/${themeId}/apply/${shopId}`, {});
      toast.success('Đã áp dụng theme! Đang mở trình chỉnh sửa…');
      // Giữ busy để nút khoá trong lúc trang điều hướng (sẽ unmount).
      return true;
    } catch (err: any) {
      toast.error(`Áp dụng thất bại: ${err.message}`);
      setBusy(null);
      return false;
    }
  }, [shopId]);

  /** Import từ Figma. Trả về true nếu thành công (trang reset form). */
  const importFigma = useCallback(async (figma: FigmaImportInput): Promise<boolean> => {
    if (!figma.fileKey.trim() || !figma.title.trim()) {
      toast.error('Cần nhập Figma file key và tên theme.');
      return false;
    }
    setImporting(true);
    try {
      await apiClient.post(`/api/themes/import-figma/${shopId}`, figma, {
        signal: AbortSignal.timeout(FIGMA_IMPORT_CLIENT_TIMEOUT_MS),
      });
      toast.success('Đã import từ Figma thành bản nháp.');
      load();
      return true;
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        toast.error(
          "Import quá lâu — file có thể nhiều frame. Đợi một lát rồi tải lại trang để kiểm tra 'Theme của tôi'.",
        );
      } else {
        toast.error(`Import thất bại: ${err.message}`);
      }
      return false;
    } finally {
      setImporting(false);
    }
  }, [shopId, load]);

  return { themes, loading, busy, importing, reload: load, submit, remove, apply, importFigma };
}
