import React from 'react';
import { Facebook, Instagram, Youtube, Music2, Mail, Phone } from 'lucide-react';

/**
 * Icon liên hệ/mạng xã hội của shop — render từ theme.social (SetupWizard lưu:
 * facebook, instagram, tiktok, youtube, email, phone). Bỏ qua key rỗng; không
 * có link nào thì không render gì.
 */
const SOCIAL_ICONS: Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; href: (v: string) => string }> = {
  facebook: { icon: Facebook, label: 'Facebook', href: (v) => v },
  instagram: { icon: Instagram, label: 'Instagram', href: (v) => v },
  tiktok: { icon: Music2, label: 'TikTok', href: (v) => v },
  youtube: { icon: Youtube, label: 'YouTube', href: (v) => v },
  email: { icon: Mail, label: 'Email', href: (v) => (v.startsWith('mailto:') ? v : `mailto:${v}`) },
  phone: { icon: Phone, label: 'Điện thoại', href: (v) => (v.startsWith('tel:') ? v : `tel:${v.replace(/\s+/g, '')}`) },
};

export function SocialLinks({ social, className = '' }: { social?: Record<string, string> | null; className?: string }) {
  if (!social) return null;
  const entries = Object.entries(social).filter(([key, value]) => SOCIAL_ICONS[key] && value?.trim());
  if (entries.length === 0) return null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {entries.map(([key, value]) => {
        const { icon: Icon, label, href } = SOCIAL_ICONS[key];
        return (
          <a
            key={key}
            href={href(value.trim())}
            target={key === 'email' || key === 'phone' ? undefined : '_blank'}
            rel="noreferrer"
            aria-label={label}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <Icon size={18} />
          </a>
        );
      })}
    </div>
  );
}
