import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3000/api';

export function useAdminActions() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkSystemHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/system/health`);
            if (!res.ok) throw new Error("Failed to fetch system health");
            return await res.json();
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const validateJsonConfig = useCallback(async (jsonConfig: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/system/validate-json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonConfig })
            });
            return await res.json();
        } catch (err: any) {
            setError(err.message);
            return { valid: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const massSyncAttribute = useCallback(async (targetAttr: string, newValue: any) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/system/mass-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetAttr, newValue })
            });
            if (!res.ok) throw new Error("Failed to execute sync");
            return await res.json();
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { checkSystemHealth, validateJsonConfig, massSyncAttribute, loading, error };
}
