'use client';

import React from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { schemaRegistry } from '@ecommerce/ui-registry/src/registry';
import { GOOGLE_FONTS } from '@ecommerce/ui-registry/src/component-schemas';
import { Settings2, Type, Image as ImageIcon, Link as LinkIcon, Palette, AlignLeft, Upload, Paintbrush, SlidersHorizontal } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

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
            <label htmlFor={id} className="text-xs text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative w-7 h-7 rounded-md overflow-hidden border border-border shrink-0">
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
                    className="w-24 bg-secondary border border-border text-xs rounded px-2 py-1 text-foreground focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

function FontRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">{label}</label>
            <select
                value={value || 'Inter'}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-secondary border border-border text-xs rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-indigo-500 appearance-none"
            >
                {GOOGLE_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                ))}
            </select>
        </div>
    );
}

function ThemeSettingsPanel() {
    const t = useTranslations('admin');
    const theme = useBuilderStore(s => s.theme) as Record<string, string>;

    // Toàn bộ cài đặt chung (màu/font/logo/tên/social) đã gom về SetupWizard để
    // tránh sửa màu ở hai nơi. Panel này chỉ là điểm vào nhanh — page đang mở
    // builder lắng nghe sự kiện và bật lại SetupWizard.
    const openSetup = () => window.dispatchEvent(new CustomEvent('builder:open-setup'));

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border sticky top-0 bg-card z-10 shrink-0">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Paintbrush size={16} className="text-indigo-400" />
                    {t('builderTool.setupGeneral')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('builderTool.setupSubtitle')}</p>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('builderTool.nothingSelected1')}
                    <span className="text-slate-200 font-medium"> {t('builderTool.setupGeneral')}</span> {t('builderTool.nothingSelected2')}
                </p>

                <button
                    onClick={openSetup}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                    <SlidersHorizontal size={15} />
                    {t('builderTool.openSetup')}
                </button>

                <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('builderTool.applying')}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="h-5 w-5 rounded border border-border shrink-0" style={{ background: theme.primaryColor || '#059669' }} />
                        {t('builderTool.primaryColor')}
                        <span className="ml-auto font-mono text-muted-foreground uppercase">{theme.primaryColor || '#059669'}</span>
                    </div>
                    {theme.shopName && (
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="text-muted-foreground">{t('builderTool.nameLabel')}</span> {theme.shopName}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------
// PropEditor – shows properties for selected element, or Theme Settings
// -----------------------------------------------------------------------
export function PropEditor() {
    const t = useTranslations('admin');
    const pages = useBuilderStore(s => s.pages);
    const activePage = useBuilderStore(s => s.activePage);
    const activeComponentId = useBuilderStore(s => s.activeComponentId);
    const activeBlockId = useBuilderStore(s => s.activeBlockId);
    const globalComponents = useBuilderStore(s => s.globalComponents);
    const updatePageSection = useBuilderStore(s => s.updatePageSection);
    const updateGlobalComponent = useBuilderStore(s => s.updateGlobalComponent);
    const updateBlockProp = useBuilderStore(s => s.updateBlockProp);
    const [isUploading, setIsUploading] = React.useState(false);
    // Wizard tạo shop (/create-shop/design) không có param [shopId] — lấy từ store
    // (loadTemplate đã set) để x-shop-id không thành "undefined" gây 403 khi upload.
    const params = useParams() as { shopId?: string };
    const storeShopId = useBuilderStore(s => s.shopId);
    const shopId = params.shopId || storeShopId || '';

    // Danh sách sản phẩm thật của shop cho field type 'product' (product picker).
    const [shopProducts, setShopProducts] = React.useState<any[]>([]);
    React.useEffect(() => {
        if (!shopId) return;
        let cancelled = false;
        (async () => {
            try {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${API_BASE}/api/catalog/products/shop/${shopId}?limit=100`, {
                    credentials: 'include',
                    headers: { 'x-shop-id': shopId },
                });
                if (!res.ok) return;
                const json = await res.json();
                const items = json.data?.data ?? json.data ?? [];
                if (!cancelled && Array.isArray(items)) setShopProducts(items);
            } catch { /* picker rơi về ô nhập ID */ }
        })();
        return () => { cancelled = true; };
    }, [shopId]);

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
            <div className="flex flex-col h-full items-center justify-center p-6 text-center text-muted-foreground">
                <Settings2 className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">{t('builderTool.nodeNotFound')}</p>
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
                else toast.error(t('builderTool.uploadFailed'));
            } else {
                toast.error(t('builderTool.uploadFailed'));
            }
        } catch {
            toast.error(t('builderTool.uploadError'));
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
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Type size={12} /> {label}
                        </label>
                        <input
                            id={elemId}
                            type="text"
                            value={currentValue ?? field.default ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
            case 'textarea':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <AlignLeft size={12} /> {label}
                        </label>
                        <textarea
                            id={elemId}
                            rows={4}
                            value={currentValue ?? field.default ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                        />
                    </div>
                );
            case 'image':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon size={12} /> {label}
                        </label>
                        {currentValue && (
                            <div className="rounded-lg overflow-hidden border border-border bg-muted aspect-video">
                                <img src={currentValue} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                id={elemId}
                                type="text"
                                value={currentValue ?? field.default ?? ''}
                                onChange={e => handlePropChange(fieldId, e.target.value)}
                                className="flex-1 bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
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
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Palette size={12} /> {label}
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-border shrink-0">
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
                                className="flex-1 bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors font-mono uppercase"
                            />
                        </div>
                    </div>
                );
            case 'boolean':
                return (
                    <div className="flex items-center justify-between py-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
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
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
                        <select
                            id={elemId}
                            value={currentValue ?? field.default ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
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
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
                        <div className="flex bg-secondary p-1 rounded-lg border border-border">
                            {field.options?.map((opt: any) => {
                                const val = opt.value || opt;
                                const isSelected = (currentValue ?? field.default) === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handlePropChange(fieldId, val)}
                                        className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {opt.label || opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'product':
                // Product picker — chọn sản phẩm thật thay vì gõ ID tay. Khi shop
                // chưa có sản phẩm, rơi về ô nhập ID để không chặn thao tác.
                if (shopProducts.length === 0) {
                    return (
                        <div className="space-y-2">
                            <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
                            <input
                                id={elemId}
                                type="text"
                                value={currentValue ?? ''}
                                onChange={e => handlePropChange(fieldId, e.target.value)}
                                placeholder={t('builderTool.productIdPlaceholder')}
                                className="w-full bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    );
                }
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
                        <select
                            id={elemId}
                            value={currentValue ?? ''}
                            onChange={e => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                        >
                            <option value="">{t('builderTool.firstProduct')}</option>
                            {shopProducts.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'number':
                return (
                    <div className="space-y-2">
                        <label htmlFor={elemId} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
                        <input
                            id={elemId}
                            type="number"
                            value={currentValue ?? field.default ?? 0}
                            onChange={e => handlePropChange(fieldId, parseFloat(e.target.value))}
                            step={field.step || 0.1}
                            min={field.min}
                            max={field.max}
                            className="w-full bg-secondary border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
            default:
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label} ({field.type})</label>
                        <textarea
                            rows={3}
                            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue ?? ''}
                            onChange={e => {
                                try { handlePropChange(fieldId, JSON.parse(e.target.value)); }
                                catch { handlePropChange(fieldId, e.target.value); }
                            }}
                            className="w-full bg-secondary border border-border text-xs font-mono rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-md shrink-0">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Settings2 size={16} className="text-indigo-400" />
                    {schema.title || targetNode.componentId}
                </h3>
                {schema.description && <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>}
                {activeBlockId && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wider">{t('builderTool.block')}</p>
                )}
            </div>

            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                {(!fields || fields.length === 0) ? (
                    <p className="text-muted-foreground text-sm">{t('builderTool.noProps')}</p>
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
                    <div className="pt-4 border-t border-border">
                        <button
                            onClick={() => {
                                const { removePageSection, activePage, setActiveComponent } = useBuilderStore.getState();
                                removePageSection(activePage, targetId!);
                                setActiveComponent(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
                        >
                            {t('builderTool.deleteSection')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
