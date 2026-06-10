'use client';

import React from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { schemaRegistry } from '@ecommerce/ui-registry/src/registry';
import { GOOGLE_FONTS } from '@ecommerce/ui-registry/src/component-schemas';
import { Settings2, Type, Image as ImageIcon, Link as LinkIcon, Palette, AlignLeft, Upload, Paintbrush } from 'lucide-react';
import { useParams } from 'next/navigation';

// -----------------------------------------------------------------------
// Recursive node finder
// -----------------------------------------------------------------------
function findNodeRecursive(nodes: any[], id: string): any | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.blocks?.length > 0) {
            const found = findNodeRecursive(node.blocks, id);
            if (found) return found;
        }
    }
    return null;
}

// -----------------------------------------------------------------------
// Theme Settings – shown when nothing is selected
// -----------------------------------------------------------------------
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const id = React.useId();
    return (
        <div className="flex items-center justify-between py-2">
            <label htmlFor={id} className="text-xs text-slate-400">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative w-7 h-7 rounded-md overflow-hidden border border-slate-700 shrink-0">
                    <input
                        id={id}
                        type="color"
                        value={value || '#000000'}
                        onChange={e => onChange(e.target.value)}
                        className="absolute -top-1 -left-1 w-10 h-10 cursor-pointer"
                    />
                </div>
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-24 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

function FontRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-slate-400">{label}</label>
            <select
                value={value || 'Inter'}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
            >
                {GOOGLE_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                ))}
            </select>
        </div>
    );
}

function ThemeSettingsPanel() {
    const rawTheme = useBuilderStore(s => s.theme);
    const setTheme = useBuilderStore(s => s.setTheme);
    const theme = rawTheme as Record<string, string>;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f]">
            <div className="p-4 border-b border-white/5 sticky top-0 bg-[#0a0a0f] z-10 shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Paintbrush size={16} className="text-indigo-400" />
                    Theme Settings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Cài đặt chung cho toàn bộ cửa hàng</p>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
                {/* Store info */}
                <section>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Thông tin cửa hàng</h4>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400">Tên cửa hàng</label>
                            <input
                                type="text"
                                value={theme.shopName || ''}
                                onChange={e => setTheme({ shopName: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Tên cửa hàng..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400">Logo URL</label>
                            <input
                                type="text"
                                value={theme.logoUrl || ''}
                                onChange={e => setTheme({ logoUrl: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </section>

                {/* Colors */}
                <section>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Màu sắc</h4>
                    <div className="bg-slate-900/50 rounded-xl px-3 divide-y divide-white/5">
                        <ColorRow label="Màu chủ đạo" value={theme.primaryColor || '#6366f1'} onChange={v => setTheme({ primaryColor: v })} />
                        <ColorRow label="Màu nền" value={theme.backgroundColor || '#ffffff'} onChange={v => setTheme({ backgroundColor: v })} />
                        <ColorRow label="Màu chữ" value={theme.textColor || '#111111'} onChange={v => setTheme({ textColor: v })} />
                        <ColorRow label="Màu nút" value={theme.buttonColor || '#6366f1'} onChange={v => setTheme({ buttonColor: v })} />
                        <ColorRow label="Màu chữ nút" value={theme.buttonTextColor || '#ffffff'} onChange={v => setTheme({ buttonTextColor: v })} />
                    </div>
                </section>

                {/* Typography */}
                <section>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Kiểu chữ</h4>
                    <div className="space-y-3">
                        <FontRow label="Font tiêu đề" value={theme.headingFont || 'Inter'} onChange={v => setTheme({ headingFont: v })} />
                        <FontRow label="Font nội dung" value={theme.bodyFont || 'Inter'} onChange={v => setTheme({ bodyFont: v })} />
                    </div>
                </section>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------
// PropEditor – shows properties for selected element, or Theme Settings
// -----------------------------------------------------------------------
export function PropEditor() {
    const pages = useBuilderStore(s => s.pages);
    const activePage = useBuilderStore(s => s.activePage);
    const activeComponentId = useBuilderStore(s => s.activeComponentId);
    const activeBlockId = useBuilderStore(s => s.activeBlockId);
    const globalComponents = useBuilderStore(s => s.globalComponents);
    const updatePageSection = useBuilderStore(s => s.updatePageSection);
    const updateGlobalComponent = useBuilderStore(s => s.updateGlobalComponent);
    const updateBlockProp = useBuilderStore(s => s.updateBlockProp);
    const [isUploading, setIsUploading] = React.useState(false);
    const { shopId } = useParams() as { shopId: string };

    const targetId = activeBlockId || activeComponentId;

    // Nothing selected → Theme Settings
    if (!targetId) {
        return <ThemeSettingsPanel />;
    }

    const sections = pages[activePage] || [];
    const allRoots = [...globalComponents, ...sections];
    const targetNode = findNodeRecursive(allRoots, targetId);

    if (!targetNode) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center text-slate-500">
                <Settings2 className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">Node not found</p>
            </div>
        );
    }

    const schema = schemaRegistry[targetNode.componentId] || {};
    const fields = schema?.settings || schema?.fields;

    const handlePropChange = (key: string, value: any) => {
        if (activeBlockId) {
            updateBlockProp(activeBlockId, key, value);
        } else {
            if (globalComponents.some(c => c.id === targetId)) {
                updateGlobalComponent(targetId!, { [key]: value });
            } else {
                updatePageSection(activePage, targetId!, { [key]: value });
            }
        }
    };

    const handleUpload = async (fieldId: string, file: File) => {
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('entityType', 'shop_logo');

            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${API_BASE}/api/media/upload`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'x-shop-id': shopId },
                body: formData,
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data?.url) handlePropChange(fieldId, json.data.url);
                else alert('Upload failed');
            } else {
                alert('Upload failed');
            }
        } catch {
            alert('Upload error');
        } finally {
            setIsUploading(false);
        }
    };

    const renderField = (field: any, currentValue: any) => {
        const fieldId = field.id || field.name;
        const elemId = `field-${fieldId}`;
        const label = field.label || field.name;

        switch (field.type) {
            case 'text':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Type size={12} /> {label}
                        </label>
                        <input
                            id={elemId}
                            type="text"
                            value={currentValue ?? field.default ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
            case 'textarea':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <AlignLeft size={12} /> {label}
                        </label>
                        <textarea
                            id={elemId}
                            rows={4}
                            value={currentValue ?? field.default ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                        />
                    </div>
                );
            case 'image':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon size={12} /> {label}
                        </label>
                        {currentValue && (
                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 aspect-video">
                                <img src={currentValue} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                id={elemId}
                                type="text"
                                value={currentValue ?? field.default ?? ''}
                                onChange={e => handlePropChange(fieldId, e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="https://"
                            />
                            <label className={`flex items-center justify-center p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload size={16} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(fieldId, f); }}
                                />
                            </label>
                        </div>
                    </div>
                );
            case 'color':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Palette size={12} /> {label}
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-slate-700 shrink-0">
                                <input
                                    id={elemId}
                                    type="color"
                                    value={currentValue ?? field.default ?? '#000000'}
                                    onChange={e => handlePropChange(fieldId, e.target.value)}
                                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={currentValue ?? field.default ?? ''}
                                onChange={e => handlePropChange(fieldId, e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono uppercase"
                            />
                        </div>
                    </div>
                );
            case 'boolean':
                return (
                    <div className="flex items-center justify-between py-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                        <button
                            id={elemId}
                            onClick={() => handlePropChange(fieldId, !(currentValue ?? field.default ?? false))}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none
                                ${(currentValue ?? field.default) ? 'bg-indigo-600' : 'bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                                ${(currentValue ?? field.default) ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                );
            case 'select':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                        <select
                            id={elemId}
                            value={currentValue ?? field.default ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                        >
                            {field.options?.map((opt: any) => (
                                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'segmented':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            {field.options?.map((opt: any) => {
                                const val = opt.value || opt;
                                const isSelected = (currentValue ?? field.default) === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handlePropChange(fieldId, val)}
                                        className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        {opt.label || opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'number':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                        <input
                            id={elemId}
                            type="number"
                            value={currentValue ?? field.default ?? 0}
                            onChange={e => handlePropChange(fieldId, parseFloat(e.target.value))}
                            step={field.step || 0.1}
                            min={field.min}
                            max={field.max}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
            default:
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label} ({field.type})</label>
                        <textarea
                            rows={3}
                            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue ?? ''}
                            onChange={e => {
                                try { handlePropChange(fieldId, JSON.parse(e.target.value)); }
                                catch { handlePropChange(fieldId, e.target.value); }
                            }}
                            className="w-full bg-slate-800 border border-slate-700 text-xs font-mono rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f]">
            <div className="p-4 border-b border-white/5 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Settings2 size={16} className="text-indigo-400" />
                    {schema.title || targetNode.componentId}
                </h3>
                {schema.description && <p className="text-xs text-slate-400 mt-1">{schema.description}</p>}
                {activeBlockId && (
                    <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wider">Block</p>
                )}
            </div>

            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                {(!fields || fields.length === 0) ? (
                    <p className="text-slate-500 text-sm">Không có thuộc tính nào để tùy chỉnh.</p>
                ) : (
                    fields.map((field: any) => {
                        const fieldId = field.id || field.name;
                        return (
                            <div key={fieldId}>
                                {renderField(field, targetNode.props?.[fieldId])}
                            </div>
                        );
                    })
                )}

                {/* Delete section button (only for page sections, not global) */}
                {!activeBlockId && !globalComponents.some(c => c.id === targetId) && (
                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={() => {
                                const { removePageSection, activePage, setActiveComponent } = useBuilderStore.getState();
                                removePageSection(activePage, targetId!);
                                setActiveComponent(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
                        >
                            Xóa section này
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
