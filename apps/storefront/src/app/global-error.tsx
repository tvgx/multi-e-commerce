'use client';

/** Catastrophic error boundary that replaces the root layout — must render its
 *  own <html>/<body>. Kept dependency-free so it works even if the app shell broke. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1rem',
            color: '#111',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Đã có lỗi xảy ra
          </h1>
          <p style={{ color: '#64748b', maxWidth: 400, marginBottom: '1.5rem' }}>
            Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#111',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
