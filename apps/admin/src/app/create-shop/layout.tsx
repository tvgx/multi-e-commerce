import { AuthGuard } from "@/components/auth/AuthGuard";

export default function CreateShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
