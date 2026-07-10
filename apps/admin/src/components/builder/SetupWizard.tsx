'use client';

import React from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { GOOGLE_FONTS } from '@ecommerce/ui-registry/src/component-schemas';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';
import {
    Store, Palette, Image as ImageIcon, Share2, PanelTop,
    Upload, Loader2, Check, ChevronLeft, ChevronRight, Sparkles, Trash2,
} from 'lucide-react';

// -----------------------------------------------------------------------
// SetupWizard — "Thiết lập chung" gateway
//
// Hiện trước khi vào canvas (lần đầu bắt buộc, mở lại được). Thu thập toàn bộ
// thông tin nền tảng của shop — tên, màu, font, logo/favicon, mạng xã hội,
// nội dung header/footer — và ghi hết vào theme JSON (qua setTheme) + đẩy
// logo/copyright vào global Header/Footer, rồi saveTemplate + cập nhật Shop.name.
// Cảm hứng: luồng setup kiểu Haravan; trang chỉnh chi tiết để lại cho canvas.
// -----------------------------------------------------------------------

interface SetupWizardProps {
    shopId: string;
    onComplete: () => void;
}

interface SetupForm {
    shopName: string;
    tagline: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    headingFont: string;
    bodyFont: string;
    logoUrl: string;
    faviconUrl: string;
    copyrightText: string;
    announcementText: string;
    social: Record<string, string>;
}

// Bảng màu sẵn — 1-click chọn cả 5 màu. Đều sáng & đơn giản theo yêu cầu.
// nameKey → dịch tại render (labelKey pattern, xem useTranslations trong component).
const COLOR_PRESETS: { nameKey: string; primary: string; background: string; text: string; button: string; buttonText: string }[] = [
    { nameKey: 'setupWizard.presetBright', primary: '#059669', background: '#ffffff', text: '#111827', button: '#059669', buttonText: '#ffffff' },
    { nameKey: 'setupWizard.presetOcean', primary: '#2563eb', background: '#ffffff', text: '#0f172a', button: '#2563eb', buttonText: '#ffffff' },
    { nameKey: 'setupWizard.presetSunset', primary: '#ea580c', background: '#fffaf5', text: '#1c1917', button: '#ea580c', buttonText: '#ffffff' },
    { nameKey: 'setupWizard.presetElegant', primary: '#111827', background: '#ffffff', text: '#111827', button: '#111827', buttonText: '#ffffff' },
    { nameKey: 'setupWizard.presetSweet', primary: '#db2777', background: '#fff1f7', text: '#1f2937', button: '#db2777', buttonText: '#ffffff' },
];

// label/placeholder có key (email/phone dịch được); Facebook… giữ nguyên tên riêng.
const SOCIAL_FIELDS: { key: string; label?: string; labelKey?: string; placeholderKey: string }[] = [
    { key: 'facebook', label: 'Facebook', placeholderKey: 'setupWizard.facebookPlaceholder' },
    { key: 'instagram', label: 'Instagram', placeholderKey: 'setupWizard.instagramPlaceholder' },
    { key: 'tiktok', label: 'TikTok', placeholderKey: 'setupWizard.tiktokPlaceholder' },
    { key: 'youtube', label: 'YouTube', placeholderKey: 'setupWizard.youtubePlaceholder' },
    { key: 'email', labelKey: 'setupWizard.socialEmailLabel', placeholderKey: 'setupWizard.socialEmailPlaceholder' },
    { key: 'phone', labelKey: 'setupWizard.socialPhoneLabel', placeholderKey: 'setupWizard.socialPhonePlaceholder' },
];

const STEPS = [
    { id: 'brand', labelKey: 'setupWizard.stepBrand', icon: Store },
    { id: 'colors', labelKey: 'setupWizard.stepColors', icon: Palette },
    { id: 'logo', labelKey: 'setupWizard.stepLogo', icon: ImageIcon },
    { id: 'social', labelKey: 'setupWizard.stepSocial', icon: Share2 },
    { id: 'headfoot', labelKey: 'setupWizard.stepHeadfoot', icon: PanelTop },
];

async function uploadImage(shopId: string, file: File, entityType: string): Promise<string> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entityType', entityType);
    const res = await fetch(`${API_BASE}/api/media/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-shop-id': shopId },
        body: fd,
    });
    if (!res.ok) throw new Error('upload failed');
    const json = await res.json();
    const url = json?.data?.url;
    if (!url) throw new Error('no url');
    return url as string;
}

export function SetupWizard({ shopId, onComplete }: SetupWizardProps) {
    const t = useTranslations('admin');
    const theme = useBuilderStore((s) => s.theme) as Record<string, any>;
    const setTheme = useBuilderStore((s) => s.setTheme);
    const globalComponents = useBuilderStore((s) => s.globalComponents);
    const updateGlobalComponent = useBuilderStore((s) => s.updateGlobalComponent);
    const saveTemplate = useBuilderStore((s) => s.saveTemplate);

    const [step, setStep] = React.useState(0);
    const [saving, setSaving] = React.useState(false);
    const [uploading, setUploading] = React.useState<'logo' | 'favicon' | null>(null);

    const [form, setForm] = React.useState<SetupForm>(() => ({
        shopName: theme.shopName || '',
        tagline: theme.tagline || '',
        primaryColor: theme.primaryColor || '#059669',
        backgroundColor: theme.backgroundColor || '#ffffff',
        textColor: theme.textColor || '#111827',
        buttonColor: theme.buttonColor || theme.primaryColor || '#059669',
        buttonTextColor: theme.buttonTextColor || '#ffffff',
        headingFont: theme.headingFont || 'Inter',
        bodyFont: theme.bodyFont || theme.fontFamily || 'Inter',
        logoUrl: theme.logoUrl || '',
        faviconUrl: theme.faviconUrl || '',
        copyrightText: theme.copyrightText || `© ${new Date().getFullYear()} ${theme.shopName || t('setupWizard.defaultShopName')}`,
        announcementText: theme.announcementText || '',
        social: { ...(theme.social || {}) },
    }));

    const set = <K extends keyof SetupForm>(key: K, value: SetupForm[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    // Áp màu trực tiếp vào canvas khi đang ở Setup, để phần preview tách bên
    // cạnh (nếu có) phản ánh ngay. Không tốn gì vì setTheme là cục bộ.
    const applyPreset = (p: typeof COLOR_PRESETS[number]) => {
        setForm((f) => ({
            ...f,
            primaryColor: p.primary,
            backgroundColor: p.background,
            textColor: p.text,
            buttonColor: p.button,
            buttonTextColor: p.buttonText,
        }));
        setTheme({
            primaryColor: p.primary,
            backgroundColor: p.background,
            textColor: p.text,
            buttonColor: p.button,
            buttonTextColor: p.buttonText,
        });
    };

    const handleUpload = async (kind: 'logo' | 'favicon', file: File) => {
        try {
            setUploading(kind);
            const url = await uploadImage(shopId, file, kind === 'logo' ? 'shop_logo' : 'shop_favicon');
            set(kind === 'logo' ? 'logoUrl' : 'faviconUrl', url);
            setTheme(kind === 'logo' ? { logoUrl: url } : { faviconUrl: url });
        } catch {
            toast.error(t('setupWizard.uploadFailed'));
        } finally {
            setUploading(null);
        }
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            // 1. Ghi toàn bộ vào theme JSON + đánh dấu đã setup
            setTheme({
                shopName: form.shopName,
                tagline: form.tagline,
                primaryColor: form.primaryColor,
                backgroundColor: form.backgroundColor,
                textColor: form.textColor,
                buttonColor: form.buttonColor,
                buttonTextColor: form.buttonTextColor,
                headingFont: form.headingFont,
                bodyFont: form.bodyFont,
                logoUrl: form.logoUrl,
                faviconUrl: form.faviconUrl,
                copyrightText: form.copyrightText,
                announcementText: form.announcementText,
                social: form.social,
                setupCompleted: true,
            });

            // 2. Đẩy thông tin xuống global Header/Footer (component, không phải zone)
            const header = globalComponents.find((c) => c.componentId === 'Header');
            if (header) updateGlobalComponent(header.id, { logoUrl: form.logoUrl, shopName: form.shopName });
            const footer = globalComponents.find((c) => c.componentId === 'Footer');
            if (footer) updateGlobalComponent(footer.id, { copyrightText: form.copyrightText, shopName: form.shopName });

            // 3. Lưu layout (theme + global) và cập nhật tên shop ở bảng Shop
            await saveTemplate(shopId);
            if (form.shopName.trim()) {
                await apiClient
                    .patch(`/api/shops/${shopId}`, { name: form.shopName.trim() }, { shopId })
                    .catch(() => { /* tên hiển thị vẫn lấy từ theme.shopName */ });
            }

            toast.success(t('setupWizard.saveSuccess'));
            onComplete();
        } catch {
            toast.error(t('setupWizard.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const isLast = step === STEPS.length - 1;

    return (
        <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header + progress */}
            <div className="shrink-0 border-b border-border bg-card px-6 py-5">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={18} className="text-brand" />
                        <h1 className="text-lg font-bold">{t('setupWizard.title')}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('setupWizard.subtitle')}
                    </p>

                    {/* Step dots */}
                    <div className="flex items-center gap-1.5 mt-5">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = i === step;
                            const done = i < step;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setStep(i)}
                                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
                                        ${active ? 'bg-foreground text-background'
                                            : done ? 'bg-brand/10 text-brand'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                                >
                                    {done ? <Check size={13} /> : <Icon size={13} />}
                                    <span className="hidden sm:inline">{t(s.labelKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Step body */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    {STEPS[step].id === 'brand' && (
                        <Section title={t('setupWizard.brandTitle')} desc={t('setupWizard.brandDesc')}>
                            <Field label={t('setupWizard.shopNameLabel')} required>
                                <input
                                    type="text"
                                    value={form.shopName}
                                    onChange={(e) => set('shopName', e.target.value)}
                                    placeholder={t('setupWizard.shopNamePlaceholder')}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label={t('setupWizard.taglineLabel')} hint={t('setupWizard.taglineHint')}>
                                <input
                                    type="text"
                                    value={form.tagline}
                                    onChange={(e) => set('tagline', e.target.value)}
                                    placeholder={t('setupWizard.taglinePlaceholder')}
                                    className={inputCls}
                                />
                            </Field>
                        </Section>
                    )}

                    {STEPS[step].id === 'colors' && (
                        <Section title={t('setupWizard.colorsTitle')} desc={t('setupWizard.colorsDesc')}>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('setupWizard.presetSectionLabel')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_PRESETS.map((p) => {
                                        const selected = form.primaryColor.toLowerCase() === p.primary.toLowerCase();
                                        return (
                                            <button
                                                key={p.nameKey}
                                                onClick={() => applyPreset(p)}
                                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all
                                                    ${selected ? 'border-foreground ring-2 ring-foreground/10' : 'border-border hover:border-foreground/30'}`}
                                            >
                                                <span className="flex -space-x-1">
                                                    <span className="h-4 w-4 rounded-full border border-white" style={{ background: p.primary }} />
                                                    <span className="h-4 w-4 rounded-full border border-white" style={{ background: p.background }} />
                                                </span>
                                                {t(p.nameKey)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 rounded-xl border border-border bg-card px-4 py-2 divide-y divide-border sm:divide-y-0">
                                <ColorRow label={t('setupWizard.colorPrimary')} value={form.primaryColor} onChange={(v) => { set('primaryColor', v); setTheme({ primaryColor: v }); }} />
                                <ColorRow label={t('setupWizard.colorBackground')} value={form.backgroundColor} onChange={(v) => { set('backgroundColor', v); setTheme({ backgroundColor: v }); }} />
                                <ColorRow label={t('setupWizard.colorText')} value={form.textColor} onChange={(v) => { set('textColor', v); setTheme({ textColor: v }); }} />
                                <ColorRow label={t('setupWizard.colorButton')} value={form.buttonColor} onChange={(v) => { set('buttonColor', v); setTheme({ buttonColor: v }); }} />
                                <ColorRow label={t('setupWizard.colorButtonText')} value={form.buttonTextColor} onChange={(v) => { set('buttonTextColor', v); setTheme({ buttonTextColor: v }); }} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <Field label={t('setupWizard.fontHeading')}>
                                    <FontSelect value={form.headingFont} onChange={(v) => { set('headingFont', v); setTheme({ headingFont: v }); }} />
                                </Field>
                                <Field label={t('setupWizard.fontBody')}>
                                    <FontSelect value={form.bodyFont} onChange={(v) => { set('bodyFont', v); setTheme({ bodyFont: v }); }} />
                                </Field>
                            </div>
                        </Section>
                    )}

                    {STEPS[step].id === 'logo' && (
                        <Section title={t('setupWizard.logoTitle')} desc={t('setupWizard.logoDesc')}>
                            <UploadRow
                                label={t('setupWizard.logoLabel')}
                                hint={t('setupWizard.logoHint')}
                                value={form.logoUrl}
                                uploading={uploading === 'logo'}
                                onFile={(f) => handleUpload('logo', f)}
                                onClear={() => { set('logoUrl', ''); setTheme({ logoUrl: '' }); }}
                                preview="logo"
                                t={t}
                            />
                            <UploadRow
                                label={t('setupWizard.faviconLabel')}
                                hint={t('setupWizard.faviconHint')}
                                value={form.faviconUrl}
                                uploading={uploading === 'favicon'}
                                onFile={(f) => handleUpload('favicon', f)}
                                onClear={() => { set('faviconUrl', ''); setTheme({ faviconUrl: '' }); }}
                                preview="favicon"
                                t={t}
                            />
                        </Section>
                    )}

                    {STEPS[step].id === 'social' && (
                        <Section title={t('setupWizard.socialTitle')} desc={t('setupWizard.socialDesc')}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {SOCIAL_FIELDS.map((s) => (
                                    <Field key={s.key} label={s.labelKey ? t(s.labelKey) : s.label!}>
                                        <input
                                            type="text"
                                            value={form.social[s.key] || ''}
                                            onChange={(e) => set('social', { ...form.social, [s.key]: e.target.value })}
                                            placeholder={t(s.placeholderKey)}
                                            className={inputCls}
                                        />
                                    </Field>
                                ))}
                            </div>
                        </Section>
                    )}

                    {STEPS[step].id === 'headfoot' && (
                        <Section title={t('setupWizard.headfootTitle')} desc={t('setupWizard.headfootDesc')}>
                            <Field label={t('setupWizard.announcementLabel')} hint={t('setupWizard.announcementHint')}>
                                <input
                                    type="text"
                                    value={form.announcementText}
                                    onChange={(e) => set('announcementText', e.target.value)}
                                    placeholder={t('setupWizard.announcementPlaceholder')}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label={t('setupWizard.copyrightLabel')}>
                                <input
                                    type="text"
                                    value={form.copyrightText}
                                    onChange={(e) => set('copyrightText', e.target.value)}
                                    placeholder={`© ${new Date().getFullYear()} ${form.shopName || t('setupWizard.defaultShopName')}`}
                                    className={inputCls}
                                />
                            </Field>
                        </Section>
                    )}
                </div>
            </div>

            {/* Footer nav */}
            <div className="shrink-0 border-t border-border bg-card px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        disabled={step === 0 || saving}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <ChevronLeft size={16} /> {t('setupWizard.back')}
                    </button>

                    <div className="flex items-center gap-2">
                        {!isLast && (
                            <button
                                onClick={onComplete}
                                disabled={saving}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2"
                            >
                                {t('setupWizard.skip')}
                            </button>
                        )}
                        {isLast ? (
                            <button
                                onClick={handleFinish}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                {t('setupWizard.finish')}
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                            >
                                {t('setupWizard.next')} <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------
// Small presentational helpers
// -----------------------------------------------------------------------
const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-colors';

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-base font-bold">{title}</h2>
            {desc && <p className="text-sm text-muted-foreground mt-0.5 mb-5">{desc}</p>}
            <div className="space-y-5">{children}</div>
        </div>
    );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">
                {label} {required && <span className="text-brand">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const id = React.useId();
    return (
        <div className="flex items-center justify-between py-2.5">
            <label htmlFor={id} className="text-sm">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 overflow-hidden rounded-md border border-border shrink-0">
                    <input id={id} type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="absolute -left-1 -top-1 h-10 w-10 cursor-pointer" />
                </div>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-24 rounded border border-border bg-background px-2 py-1 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <select value={value || 'Inter'} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {GOOGLE_FONTS.map((f: { value: string; label: string }) => (
                <option key={f.value} value={f.value}>{f.label}</option>
            ))}
        </select>
    );
}

function UploadRow({
    label, hint, value, uploading, onFile, onClear, preview, t,
}: {
    label: string; hint: string; value: string; uploading: boolean;
    onFile: (f: File) => void; onClear: () => void; preview: 'logo' | 'favicon';
    t: (key: string) => string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-4">
                <div className={`shrink-0 flex items-center justify-center overflow-hidden rounded-lg border border-border bg-background
                    ${preview === 'favicon' ? 'h-12 w-12' : 'h-12 w-28'}`}>
                    {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value} alt={label} className="h-full w-full object-contain" />
                    ) : (
                        <ImageIcon size={18} className="text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <label className={`inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-muted transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                            {value ? t('setupWizard.changeImage') : t('setupWizard.upload')}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                        </label>
                        {value && (
                            <button onClick={onClear} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 size={13} /> {t('setupWizard.remove')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
