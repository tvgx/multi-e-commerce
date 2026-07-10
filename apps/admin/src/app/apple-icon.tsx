import { ImageResponse } from 'next/og';

// Apple touch icon (fix audit "No Apple touch icon"). Render bằng next/og
// nên không cần file PNG nhị phân trong repo.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
