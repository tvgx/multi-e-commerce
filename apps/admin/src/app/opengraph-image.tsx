import { ImageResponse } from 'next/og';

// OG/Twitter card. Text để ASCII để tránh phụ thuộc font Vietnamese trong Satori.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#030014',
          color: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#ffffff" />
            </svg>
          </div>
          <div style={{ fontSize: 68, fontWeight: 700 }}>OmniCommerce</div>
        </div>
        <div style={{ fontSize: 32, color: '#94a3b8' }}>Admin Dashboard</div>
      </div>
    ),
    { ...size },
  );
}
