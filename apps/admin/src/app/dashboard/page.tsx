"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ExternalLink, Palette, Plus, Store } from "lucide-react";

type Shop = {
  id: string;
  name: string;
  domain?: string | null;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

function buildStorefrontUrl(shop: Shop): string {
  const configured = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (configured) {
    return `${configured.replace(/\/$/, "")}/${shop.id}`;
  }

  if (!shop.domain) {
    return `http://localhost:5201/${shop.id}`;
  }

  if (shop.domain.includes(".")) {
    return `https://${shop.domain}`;
  }

  return `http://${shop.domain}.localhost:5201`;
}

export default function ShopManagementDashboardPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Shop[]>("/api/shops/my-shops");
        setShops(res.data || []);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch shops";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const sortedShops = useMemo(() => {
    return [...shops].sort((a, b) => {
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return right - left;
    });
  }, [shops]);

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Shops</h1>
            <p className="text-slate-400 mt-2">Manage existing shops, update design, or open storefront links.</p>
          </div>
          <Link
            href="/create-shop"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2.5 font-semibold hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Shop
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-slate-400">Loading shops...</div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">{error}</div>
        )}

        {!loading && !error && sortedShops.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <Store className="w-10 h-10 mx-auto text-slate-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No shops yet</h2>
            <p className="text-slate-400 mb-6">Create your first shop to start publishing storefront content.</p>
            <Link href="/create-shop" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 font-semibold hover:bg-indigo-400 transition-colors">
              <Plus className="w-4 h-4" />
              Create Shop
            </Link>
          </div>
        )}

        {!loading && !error && sortedShops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedShops.map((shop) => {
              const storefrontUrl = buildStorefrontUrl(shop);
              return (
                <div key={shop.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{shop.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">ID: {shop.id}</p>
                    <div className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                      {shop.status || "DRAFT"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/${shop.id}/online-store/themes`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400 transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      Edit Design
                    </button>

                    <Link
                      href={`/dashboard/${shop.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-semibold hover:bg-white/10 transition-colors"
                    >
                      Open Shop Admin
                    </Link>

                    <Link
                      href={storefrontUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-semibold hover:bg-white/10 transition-colors"
                    >
                      View Shop
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
