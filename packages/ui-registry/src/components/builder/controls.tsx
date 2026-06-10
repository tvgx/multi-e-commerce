"use client"

import React, { useRef, useState } from 'react';
import { PageTypeEnum } from '@ecommerce/schema';
import { Upload, X, Loader2 } from 'lucide-react';
import { useBuilderStore } from '../../store/builder-store';

interface BaseControlProps {
    label: string;
    value: any;
    onChange: (val: any) => void;
}

// Upload to the media API and return the stored URL. Embedding files as
// base64 data-URLs bloated the layout JSON to multi-MB documents that were
// saved to MongoDB and shipped to every storefront visitor.
async function uploadMediaFile(file: File, shopId: string | null): Promise<string | null> {
    if (!shopId) {
        console.warn('[controls] Cannot upload image: builder shopId is not set');
        return null;
    }
    try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'layout_image');
        const res = await fetch(`${API_BASE}/api/media/upload`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'x-shop-id': shopId },
            body: formData,
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data?.url || null;
    } catch {
        return null;
    }
}

const GOOGLE_FONTS = [
    "Inter", "Roboto", "Playfair Display", "Lora", "Montserrat",
    "Oswald", "Raleway", "Nunito", "Poppins", "Source Sans 3"
];

export function SliderControl({ label, value, onChange, min = 0, max = 100 }: BaseControlProps & { min?: number, max?: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-medium text-zinc-400">
                <label>{label}</label>
                <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{value || 0}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value || 0}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-emerald-500"
            />
        </div>
    );
}

export function SegmentedControl({ label, value, onChange, options }: BaseControlProps & { options: string[] }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <div className="flex p-0.5 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                {options.map(opt => {
                    const isActive = value === opt;
                    return (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-all ${
                                isActive 
                                ? 'bg-zinc-800 text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function PageSelectorControl({ label, value, onChange }: BaseControlProps) {
    // Lấy danh sách các trang tĩnh từ Enum
    const pages = PageTypeEnum.options;
    
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
            >
                <option value="" disabled>-- Chọn trang đích --</option>
                {pages.map(page => (
                    <option key={page} value={`/${page === 'home' ? '' : page}`}>
                        {page.replace('_', ' ').toUpperCase()}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function ColorPickerControl({ label, value, onChange }: BaseControlProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <div className="flex gap-3 items-center">
                <div className="relative w-8 h-8 rounded overflow-hidden border border-zinc-700 shrink-0">
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                    />
                </div>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            </div>
        </div>
    );
}

export function ResourcePickerControl({ label, value, onChange }: BaseControlProps) {
    const shopId = useBuilderStore(s => s.shopId);
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = async (file: File) => {
        setIsUploading(true);
        const url = await uploadMediaFile(file, shopId);
        setIsUploading(false);
        if (url) onChange(url);
        else alert('Tải ảnh thất bại. Vui lòng thử lại.');
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            {value && (
                <div className="mb-2 relative rounded-md overflow-hidden border border-zinc-700 bg-zinc-900 group aspect-video">
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    <button
                        onClick={() => onChange('')}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <label
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded-md border border-zinc-700 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                    {isUploading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Chọn ảnh
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }}
                    />
                </label>
            </div>
        </div>
    );
}

export function ImagePickerControl({ label, value, onChange }: BaseControlProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const shopId = useBuilderStore(s => s.shopId);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageClick = () => {
        if (!isUploading) fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const url = await uploadMediaFile(file, shopId);
        setIsUploading(false);
        if (url) onChange(url);
        else alert('Tải ảnh thất bại. Vui lòng thử lại.');
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <div
                onClick={handleImageClick}
                className="relative rounded-md overflow-hidden border border-zinc-700 bg-zinc-900 group aspect-video cursor-pointer hover:border-zinc-600 transition-colors"
            >
                {value ? (
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Upload className="h-8 w-8" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">Tải ảnh mới</span>
                    </div>
                </div>
                {value && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            <div className="text-xs text-zinc-500 text-center">
                Click to upload or clear
            </div>
        </div>
    );
}

export function FontPickerControl({ label, value, onChange }: BaseControlProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <select
                value={value || 'Inter'}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
            >
                {GOOGLE_FONTS.map(font => (
                    <option key={font} value={font}>
                        {font}
                    </option>
                ))}
            </select>
            <div className="text-xs text-zinc-500 mt-2 p-2 bg-zinc-900 rounded">
                Preview: <span style={{ fontFamily: value || 'Inter' }}>{value || 'Inter'}</span>
            </div>
        </div>
    );
}

export function TextControl({ label, value, onChange }: BaseControlProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
        </div>
    );
}

export function SelectControl({ label, value, onChange, options }: BaseControlProps & { options: string[] }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{label}</label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
            >
                <option value="" disabled>-- Chọn --</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}
