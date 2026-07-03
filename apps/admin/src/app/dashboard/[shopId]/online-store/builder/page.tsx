'use client';

import React, { useEffect, use } from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { SectionList } from '@/components/builder/SectionList';
import { PropEditor } from '@/components/builder/PropEditor';
import { PageSwitcher } from '@/components/builder/PageSwitcher';
import { CanvasRenderer } from '@ecommerce/ui-registry/src/components/builder/canvas-renderer';
import { SetupWizard } from '@/components/builder/SetupWizard';
import { ArrowLeft, Save, Loader2, Monitor, Smartphone, RotateCcw, RotateCw, Globe, CheckCircle, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { apiClient } from '@/lib/api-client';

export default function BuilderPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = use(params);
    const loadTemplate = useBuilderStore(s => s.loadTemplate);
    const saveTemplate = useBuilderStore(s => s.saveTemplate);
    const publishTemplate = useBuilderStore(s => s.publishTemplate);
    const isLoading = useBuilderStore(s => s.isLoading);
    const deviceMode = useBuilderStore(s => s.deviceMode);
    const setDeviceMode = useBuilderStore(s => s.setDeviceMode);
    const undo = useBuilderStore(s => s.undo);
    const redo = useBuilderStore(s => s.redo);
    const history = useBuilderStore(s => s.history);
    const theme = useBuilderStore(s => s.theme) as Record<string, any>;

    const [saving, setSaving] = React.useState(false);
    const [publishing, setPublishing] = React.useState(false);
    const [publishSuccess, setPublishSuccess] = React.useState(false);
    const [isNavigating, setIsNavigating] = React.useState(false);
    const [showSetup, setShowSetup] = React.useState(false);
    const setupCheckedRef = React.useRef(false);
    const router = useRouter();

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    useEffect(() => {
        loadTemplate(shopId);
    }, [loadTemplate, shopId]);

    // First time into the builder for a shop that hasn't finished Setup → open the
    // Setup gateway. After it's done once (theme.setupCompleted) we go straight to
    // the canvas; the owner can reopen Setup from the toolbar any time.
    useEffect(() => {
        if (!isLoading && !setupCheckedRef.current) {
            setupCheckedRef.current = true;
            if (!theme?.setupCompleted) setShowSetup(true);
        }
    }, [isLoading, theme]);

    // The "nothing selected" panel (PropEditor) reopens Setup via this event.
    useEffect(() => {
        const open = () => setShowSetup(true);
        window.addEventListener('builder:open-setup', open);
        return () => window.removeEventListener('builder:open-setup', open);
    }, []);

    // Real products for a truthful preview; falls back to the sample catalog when
    // the shop has none yet (handled inside CanvasRenderer).
    const [previewProducts, setPreviewProducts] = React.useState<any[]>([]);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await apiClient.get<any>(`/api/catalog/products/shop/${shopId}?limit=12`, { shopId });
                const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
                if (!cancelled) setPreviewProducts(list);
            } catch { /* keep sample fallback */ }
        })();
        return () => { cancelled = true; };
    }, [shopId]);

    // Keyboard shortcuts: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;
            if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
            if (e.key === 's') { e.preventDefault(); saveTemplate(shopId); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo, saveTemplate, shopId]);

    const handleSave = async () => {
        setSaving(true);
        await saveTemplate(shopId);
        setSaving(false);
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await publishTemplate(shopId);
            setPublishSuccess(true);
            toast.success('Xuất bản thành công! Đang chuyển trang...');
            setTimeout(() => {
                setIsNavigating(true);
                router.push(`/dashboard/${shopId}/online-store/navigation`);
            }, 1000);
        } catch {
            toast.error('Xuất bản thất bại. Vui lòng thử lại.');
            setPublishing(false);
        }
    };

    if (isLoading || isNavigating) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                {isNavigating && <p className="text-muted-foreground text-sm">Đang tải cấu hình Navigation...</p>}
            </div>
        );
    }

    if (showSetup) {
        return (
            <div className="h-[calc(100vh-80px)] -m-8">
                <SetupWizard shopId={shopId} onComplete={() => setShowSetup(false)} />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col -m-8">
            {/* Toolbar */}
            <div className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0 gap-2">
                {/* Left: back + title */}
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href={`/dashboard/${shopId}/online-store/themes`}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <span className="hidden lg:inline text-sm font-semibold text-foreground truncate">Trình thiết kế</span>
                    <PageSwitcher variant="dark" />
                    <button
                        onClick={() => setShowSetup(true)}
                        title="Thiết lập chung (màu, logo, thông tin shop)"
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs font-medium px-2 py-1.5 rounded-md shrink-0"
                    >
                        <SlidersHorizontal size={14} />
                        <span className="hidden xl:inline">Thiết lập chung</span>
                    </button>
                </div>

                {/* Center: device + undo/redo */}
                <div className="flex items-center gap-1">
                    {/* Undo/Redo */}
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-muted-foreground hover:bg-accent hover:text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'}`}
                    >
                        <RotateCcw size={15} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-muted-foreground hover:bg-accent hover:text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'}`}
                    >
                        <RotateCw size={15} />
                    </button>

                    <div className="w-px h-4 bg-border mx-1" />

                    {/* Device mode */}
                    <div className="flex bg-slate-800 rounded-md p-0.5">
                        <button
                            onClick={() => setDeviceMode('desktop')}
                            title="Desktop"
                            className={`p-1.5 rounded transition-colors ${deviceMode === 'desktop' ? 'bg-indigo-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            onClick={() => setDeviceMode('mobile')}
                            title="Mobile"
                            className={`p-1.5 rounded transition-colors ${deviceMode === 'mobile' ? 'bg-indigo-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Smartphone size={14} />
                        </button>
                    </div>
                </div>

                {/* Right: Save + Publish */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        title="Save (Ctrl+S)"
                        className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Lưu
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold disabled:opacity-50
                            ${publishSuccess
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                    >
                        {publishing
                            ? <Loader2 size={13} className="animate-spin" />
                            : publishSuccess
                                ? <CheckCircle size={13} />
                                : <Globe size={13} />
                        }
                        {publishSuccess ? 'Đã xuất bản!' : 'Xuất bản'}
                    </button>
                </div>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Section tree */}
                <div
                    data-builder-panel="left"
                    className="w-72 border-r border-border bg-card overflow-y-auto shrink-0 flex flex-col"
                >
                    <SectionList />
                </div>

                {/* Center: Canvas */}
                <div className="flex-1 bg-background overflow-auto flex items-start justify-center p-8 relative">
                    <div className={`transition-all duration-300 bg-white shadow-2xl overflow-hidden border border-border ${deviceMode === 'mobile' ? 'w-[390px] rounded-[2rem]' : 'w-full max-w-[1280px] rounded-xl'}`}>
                        <CanvasRenderer previewProducts={previewProducts} />
                    </div>
                </div>

                {/* Right Panel: Properties */}
                <div className="w-72 border-l border-border bg-card overflow-y-auto shrink-0">
                    <PropEditor />
                </div>
            </div>
        </div>
    );
}
