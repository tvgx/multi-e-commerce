import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { apiClient } from "../lib/api-client";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";

interface UseOnboardingAutoNavOptions {
  shopId: string;
  currentStep: number;
  nextRoute: string;
  isLastStep?: boolean;
}

/**
 * Hook cung cấp hàm `completeAndNavigate()` để đánh dấu step hiện tại
 * là COMPLETED rồi tự động chuyển sang step tiếp theo.
 *
 * Nếu `isLastStep` = true → navigate về dashboard (hiển thị URL shop).
 */
export function useOnboardingAutoNav({
  shopId,
  currentStep,
  nextRoute,
  isLastStep = false,
}: UseOnboardingAutoNavOptions) {
  const router = useRouter();

  const completeAndNavigate = useCallback(async () => {
    try {
      await apiClient.patch(
        `/api/shops/${shopId}/onboarding/complete/${currentStep}`,
        {},
      );
      toast.success("Đã hoàn thành! Chuyển sang bước tiếp theo...");

      if (isLastStep) {
        router.push(`/dashboard/${shopId}`);
      } else {
        router.push(nextRoute);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật tiến trình");
    }
  }, [shopId, currentStep, nextRoute, isLastStep, router]);

  return { completeAndNavigate };
}
