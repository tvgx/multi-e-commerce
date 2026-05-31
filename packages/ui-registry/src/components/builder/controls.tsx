"use client"

import React from 'react';
import { PageTypeEnum } from '@ecommerce/schema';

interface BaseControlProps {
    label: string;
    value: any;
    onChange: (val: any) => void;
}

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
                <button 
                    onClick={() => {
                        // Mock upload for testing
                        onChange("http://localhost:9000/assets/default-1.png");
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded-md border border-zinc-700 transition-colors shrink-0"
                >
                    Chọn ảnh
                </button>
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
