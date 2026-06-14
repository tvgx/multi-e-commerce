import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/api-client";

export interface OnboardingStep {
  status: "COMPLETED" | "PENDING" | "LOCKED";
  label: string;
}

export interface OnboardingStatus {
  currentStep: number;
  domain?: string;
  steps: {
    [key: string]: OnboardingStep;
  };
}

export function useOnboarding(shopId: string | null) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<OnboardingStatus>(`/api/shops/${shopId}/onboarding`);
      setStatus(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const completeStep = async (step: number) => {
    if (!shopId) return;
    try {
      await apiClient.patch(`/api/shops/${shopId}/onboarding/complete/${step}`, {});
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const totalSteps = 6;
  const completedCount = status
    ? Object.values(status.steps).filter((s) => s.status === "COMPLETED").length
    : 0;
  const progressPercentage = status
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;
  const allCompleted = completedCount === totalSteps;
  const shopDomain = status?.domain || null;

  return {
    status,
    loading,
    error,
    progressPercentage,
    allCompleted,
    shopDomain,
    refresh: fetchStatus,
    completeStep,
  };
}
