// ────────────────────────────────────────────────────────────────────────────
// Sentry init — PHẢI chạy TRƯỚC mọi import khác (Nest, Express, Prisma…) vì
// nó phải "vá" (instrument) các thư viện đó ngay lúc chúng được nạp. Vì vậy file
// này được import ở DÒNG ĐẦU TIÊN của main.ts.
//
// Không set SENTRY_DSN => Sentry tự no-op, app chạy bình thường (an toàn cho dev).
// ────────────────────────────────────────────────────────────────────────────
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // TRACING — đo thời gian TỪNG request và tự sinh span cho HTTP client,
  // Express routing, và các thao tác DB (Prisma) được auto-instrument.
  // 1.0 = lấy 100% khi đang đo. Trên prod hạ xuống ~0.1 để đỡ tốn quota.
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 1.0),

  // PROFILING function-level — gắn CPU profile vào từng trace, cho bạn thấy
  // CHÍNH XÁC function nào ngốn CPU bên trong mỗi request (self time + call tree).
  integrations: [nodeProfilingIntegration()],
  profileLifecycle: 'trace', // tự start/stop profiler theo mỗi transaction
  profileSessionSampleRate: Number(
    process.env.SENTRY_PROFILE_SAMPLE_RATE ?? 1.0,
  ),

  sendDefaultPii: false,
});
