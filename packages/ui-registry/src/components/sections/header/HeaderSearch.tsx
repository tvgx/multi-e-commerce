'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

/**
 * Nút search trong builder Header — bấm vào mở ô nhập, submit điều hướng
 * sang trang all-products kèm ?q= (trang này đã hỗ trợ search server-side).
 */
export const HeaderSearch: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const params = useParams();
    const shopSlug = params?.shopSlug as string | undefined;

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        const base = shopSlug ? `/${shopSlug}` : '';
        router.push(`${base}/all-products?q=${encodeURIComponent(q)}`);
    };

    if (!open) {
        return (
            <button
                className="p-2 text-inherit opacity-80 hover:opacity-100"
                title="Search"
                onClick={() => setOpen(true)}
            >
                <Search className="h-5 w-5" />
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="flex items-center gap-1">
            <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                placeholder="Tìm sản phẩm..."
                className="w-40 sm:w-56 px-3 py-1.5 text-sm rounded-full border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="p-2 text-inherit opacity-80 hover:opacity-100" title="Search">
                <Search className="h-5 w-5" />
            </button>
            <button
                type="button"
                className="p-1 text-inherit opacity-60 hover:opacity-100"
                title="Close search"
                onClick={() => { setOpen(false); setQuery(''); }}
            >
                <X className="h-4 w-4" />
            </button>
        </form>
    );
};
