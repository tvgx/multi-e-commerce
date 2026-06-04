import { getShopInfo } from '@/lib/api/storefront.api';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shopInfo = await getShopInfo(shopSlug);

  return <ForgotPasswordForm shopSlug={shopSlug} shopId={shopInfo?.id || ''} />;
}
