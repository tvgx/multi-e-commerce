import { ResetPasswordForm } from './ResetPasswordForm';

export default async function ResetPasswordPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  return <ResetPasswordForm shopSlug={shopSlug} />;
}
