import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "../lib/api-client";

export interface BuildStatus {
  shopId: string;
  jobId: string | null;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  percent: number;
  stage: string | null;
  storefrontUrl: string | null;
  error: string | null;
  updatedAt: string | null;
}

/**
 * Poll tiến độ build shop mỗi 2s cho tới khi COMPLETED/FAILED.
 * `restartKey` đổi giá trị để khởi động lại vòng poll (dùng cho nút "Thử lại").
 */
export function useBuildStatus(shopId: string | null, enabled: boolean, restartKey = 0) {
  const [status, setStatus] = useState<BuildStatus | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!shopId) return null;
    try {
      const res = await apiClient.get<BuildStatus>(`/api/shops/${shopId}/build-status`);
      setStatus(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, [shopId]);

  useEffect(() => {
    if (!enabled || !shopId) return;
    let active = true;

    const tick = async () => {
      const s = await fetchStatus();
      if (!active) return;
      if (s && (s.status === "COMPLETED" || s.status === "FAILED")) return; // dừng poll
      timer.current = setTimeout(tick, 2000);
    };
    tick();

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, shopId, restartKey, fetchStatus]);

  return { status, refresh: fetchStatus };
}
