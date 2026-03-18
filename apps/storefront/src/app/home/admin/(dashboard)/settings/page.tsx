"use client";
import React, { useState, useEffect } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const shopId = "shop-1"; // Default mock tenant ID

    const [settings, setSettings] = useState({
        name: "",
        slug: "",
        productsPerPage: 30,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${getApiUrl()}/api/shops/${shopId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.metadata) {
                        setSettings({
                            name: data.metadata.name || "",
                            slug: data.metadata.slug || "",
                            productsPerPage: data.metadata.productsPerPage || 30
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [shopId]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${getApiUrl()}/api/shops/${shopId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    metadata: {
                        name: settings.name,
                        slug: settings.slug,
                        productsPerPage: Number(settings.productsPerPage),
                    }
                })
            });

            if (!res.ok) throw new Error("Failed to save settings");
            
            setSuccess("Shop settings updated successfully.");
        } catch (err) {
            console.error(err);
            setError("Could not save settings. Ensure API is running.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Shop Settings</h1>
                    <p className="text-zinc-500 text-sm mt-1">Configure your storefront preferences and metadata.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium relative">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {success && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium relative">
                    <AlertCircle className="w-4 h-4" /> {success}
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-900 mb-4">Store Identity</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Store Name</label>
                            <input 
                                value={settings.name}
                                onChange={(e) => setSettings({...settings, name: e.target.value})}
                                type="text" 
                                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Store Slug</label>
                            <input 
                                value={settings.slug}
                                onChange={(e) => setSettings({...settings, slug: e.target.value})}
                                type="text" 
                                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-900 mb-4">Catalog Preferences</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Products Per Page</label>
                            <select 
                                value={settings.productsPerPage}
                                onChange={(e) => setSettings({...settings, productsPerPage: Number(e.target.value)})}
                                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            >
                                <option value={10}>10 Products</option>
                                <option value={20}>20 Products</option>
                                <option value={30}>30 Products</option>
                                <option value={50}>50 Products</option>
                            </select>
                            <p className="text-xs text-zinc-500 mt-2">Maximum number of items displayed on shop catalog.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
