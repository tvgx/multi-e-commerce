"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function useCheckAuth() {
  const router = useRouter();

  const checkAndNavigate = async (target: string) => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session) {
        // Redirect to login with callback
        router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
        return false;
      }
      router.push(target);
      return true;
    } catch (error) {
      router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
      return false;
    }
  };

  return { checkAndNavigate };
}
