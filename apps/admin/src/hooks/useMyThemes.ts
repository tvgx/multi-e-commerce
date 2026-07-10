import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

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
  const t = useTranslations('admin');
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
      toast.error(t('hooks.myThemesLoadFailed', { msg: err.message }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async (themeId: string) => {
    setBusy(themeId);
    try {
      await apiClient.patch(`/api/themes/${themeId}/submit`, {});
      toast.success(t('hooks.myThemesSubmitted'));
      load();
    } catch (err: any) {
      toast.error(t('hooks.myThemesSubmitFailed', { msg: err.message }));
    } finally {
      setBusy(null);
    }
  }, [load, t]);

  const remove = useCallback(async (themeId: string) => {
    if (!(await confirmDialog({ message: t('hooks.myThemesDeleteConfirm'), danger: true }))) return;
    setBusy(themeId);
    try {
      await apiClient.delete(`/api/themes/${themeId}`);
      toast.success(t('hooks.myThemesDeleted'));
      setThemes((list) => list.filter((x) => x.themeId !== themeId));
    } catch (err: any) {
      toast.error(t('hooks.myThemesDeleteFailed', { msg: err.message }));
    } finally {
      setBusy(null);
    }
  }, [t]);

  /** Áp dụng theme vào shop. Trả về true nếu thành công (trang mở builder). */
  const apply = useCallback(async (themeId: string): Promise<boolean> => {
    setBusy(themeId);
    try {
      await apiClient.post(`/api/themes/${themeId}/apply/${shopId}`, {});
      toast.success(t('hooks.myThemesApplied'));
      // Giữ busy để nút khoá trong lúc trang điều hướng (sẽ unmount).
      return true;
    } catch (err: any) {
      toast.error(t('hooks.myThemesApplyFailed', { msg: err.message }));
      setBusy(null);
      return false;
    }
  }, [shopId, t]);

  /** Import từ Figma. Trả về true nếu thành công (trang reset form). */
  const importFigma = useCallback(async (figma: FigmaImportInput): Promise<boolean> => {
    if (!figma.fileKey.trim() || !figma.title.trim()) {
      toast.error(t('hooks.myThemesFigmaRequired'));
      return false;
    }
    setImporting(true);
    try {
      await apiClient.post(`/api/themes/import-figma/${shopId}`, figma, {
        signal: AbortSignal.timeout(FIGMA_IMPORT_CLIENT_TIMEOUT_MS),
      });
      toast.success(t('hooks.myThemesFigmaImported'));
      load();
      return true;
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        toast.error(t('hooks.myThemesImportTimeout'));
      } else {
        toast.error(t('hooks.myThemesImportFailed', { msg: err.message }));
      }
      return false;
    } finally {
      setImporting(false);
    }
  }, [shopId, load, t]);

  return { themes, loading, busy, importing, reload: load, submit, remove, apply, importFigma };
}
