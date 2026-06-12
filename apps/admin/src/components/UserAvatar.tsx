import React from 'react';

/** Two-letter initials from a display name or email, for the avatar fallback. */
export function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar that fills its (already sized/rounded) parent. Shows the user's image
 * when available, otherwise initials — no external avatar service calls.
 */
export function UserAvatar({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const label = (name || email || 'User').trim();
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={label} className="w-full h-full object-cover" />;
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-zinc-700 text-xs font-semibold uppercase text-white">
      {getInitials(label)}
    </span>
  );
}
