"use client";

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const VISITOR_KEY = 'sf_visitor_id';
// Server dedup phiên 30' — client chỉ throttle để đỡ bắn request thừa
const PING_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Beacon đếm lượt ghé shop cho analytics (tỷ lệ chuyển đổi, funnel).
 * visitorId là uuid sinh một lần, lưu localStorage — đếm được cả khách
 * vãng lai. Khi khách đăng nhập, ping thêm một lần để gắn customerId
 * vào phiên đang mở. Lỗi tracking không được làm hỏng trang.
 */
export function VisitTracker({ shopId, customerId }: { shopId: string; customerId?: string }) {
  useEffect(() => {
    if (!shopId) return;
    try {
      let visitorId = localStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(VISITOR_KEY, visitorId);
      }

      const pingKey = `sf_visit_ping:${shopId}:${customerId ? 'auth' : 'anon'}`;
      const lastPing = Number(sessionStorage.getItem(pingKey) || 0);
      if (Date.now() - lastPing < PING_INTERVAL_MS) return;
      sessionStorage.setItem(pingKey, String(Date.now()));

      fetch(`${API_URL}/api/analytics/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          visitorId,
          customerId: customerId || undefined,
          path: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // localStorage có thể bị chặn (private mode) — bỏ qua
    }
  }, [shopId, customerId]);

  return null;
}
