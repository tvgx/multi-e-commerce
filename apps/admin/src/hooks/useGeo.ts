import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/api-client";

export interface Province {
  code: string;
  name: string;
}
export interface Ward {
  code: string;
  name: string;
  provinceCode: string;
}

/** Dropdown địa giới hành chính VN 2 cấp (Tỉnh/Thành → Phường/Xã) lấy từ /api/geo. */
export function useGeo() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    apiClient
      .get<Province[]>("/api/geo/provinces")
      .then((r) => setProvinces(r.data || []))
      .catch(() => setProvinces([]));
  }, []);

  const loadWards = useCallback(async (provinceCode: string) => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    try {
      const r = await apiClient.get<Ward[]>(`/api/geo/provinces/${provinceCode}/wards`);
      setWards(r.data || []);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  return { provinces, wards, loadWards, loadingWards };
}
