import { redirect } from "next/navigation";

export default async function OnlineStorePage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  redirect(`/dashboard/${shopId}/online-store/themes`);
}
