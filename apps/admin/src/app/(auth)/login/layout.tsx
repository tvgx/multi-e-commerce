import type { Metadata } from 'next';
import { getT } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('admin');
  return { title: t('auth.login.title') };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
