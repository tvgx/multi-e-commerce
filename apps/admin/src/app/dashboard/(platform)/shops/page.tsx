"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ExternalLink, Palette, Plus, Store } from "lucide-react";
import { useCheckAuth } from "@/hooks/useCheckAuth";

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
    return `http://localhost:3002/${shop.id}`;
  }

  if (shop.domain.includes(".")) {
    return `https://${shop.domain}`;
  }

  return `http://${shop.domain}.localhost:3002`;
}

export default function ShopsPage() {
  const router = useRouter();
  const { checkAndNavigate } = useCheckAuth();
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
    <div className="p-6 md:p-10 text-zinc-100 min-h-full">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">My Shops</h1>
            <p className="text-zinc-400 mt-2">Manage your existing shops, update design, or open storefront links.</p>
          </div>
          <button
            onClick={() => checkAndNavigate("/create-shop")}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2.5 font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Shop
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-zinc-400 text-center">
            <div className="animate-pulse">Loading shops...</div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && sortedShops.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <Store className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No shops yet</h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">Create your first shop to start building your brand and selling products online.</p>
            <button
              onClick={() => checkAndNavigate("/create-shop")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold hover:bg-indigo-500 transition-colors text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Your First Shop
            </button>
          </div>
        )}

        {!loading && !error && sortedShops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedShops.map((shop) => {
              const storefrontUrl = buildStorefrontUrl(shop);
              return (
                <div key={shop.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-sm hover:shadow-md">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">{shop.name}</h2>
                    <p className="text-xs font-mono text-zinc-500 mt-1">{shop.id}</p>
                    <div className="mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {shop.status || "ACTIVE"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link
                      href={`/dashboard/${shop.id}`}
                      className="flex-1 text-center inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors text-white"
                    >
                      Open Admin
                    </Link>

                    <button
                      onClick={() => router.push(`/dashboard/${shop.id}/online-store/themes`)}
                      title="Edit Design"
                      className="inline-flex items-center justify-center rounded-xl bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    >
                      <Palette className="w-5 h-5" />
                    </button>

                    <Link
                      href={storefrontUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="View Storefront"
                      className="inline-flex items-center justify-center rounded-xl bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    >
                      <ExternalLink className="w-5 h-5" />
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
