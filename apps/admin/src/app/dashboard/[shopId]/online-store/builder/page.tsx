'use client';

import React, { useEffect, use } from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { SectionList } from '@/components/builder/SectionList';
import { PropEditor } from '@/components/builder/PropEditor';
import { CanvasRenderer } from '@ecommerce/ui-registry/src/components/builder/canvas-renderer';
import { ArrowLeft, Save, Loader2, Monitor, Smartphone, RotateCcw, RotateCw, Globe, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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

    const [saving, setSaving] = React.useState(false);
    const [publishing, setPublishing] = React.useState(false);
    const [publishSuccess, setPublishSuccess] = React.useState(false);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    useEffect(() => {
        loadTemplate(shopId);
    }, [loadTemplate, shopId]);

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
            setTimeout(() => setPublishSuccess(false), 3000);
        } catch {
            alert('Xuất bản thất bại. Vui lòng thử lại.');
        } finally {
            setPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col -m-8">
            {/* Toolbar */}
            <div className="h-12 border-b border-white/5 bg-[#0a0a0f] flex items-center justify-between px-3 shrink-0 gap-2">
                {/* Left: back + title */}
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href={`/dashboard/${shopId}/online-store/themes`}
                        className="text-slate-500 hover:text-white transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <span className="text-sm font-semibold text-white truncate">Theme Builder</span>
                </div>

                {/* Center: device + undo/redo */}
                <div className="flex items-center gap-1">
                    {/* Undo/Redo */}
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                    >
                        <RotateCcw size={15} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                    >
                        <RotateCw size={15} />
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    {/* Device mode */}
                    <div className="flex bg-slate-800 rounded-md p-0.5">
                        <button
                            onClick={() => setDeviceMode('desktop')}
                            title="Desktop"
                            className={`p-1.5 rounded transition-colors ${deviceMode === 'desktop' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            onClick={() => setDeviceMode('mobile')}
                            title="Mobile"
                            className={`p-1.5 rounded transition-colors ${deviceMode === 'mobile' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
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
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
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
                    className="w-72 border-r border-white/5 bg-[#0a0a0f] overflow-y-auto shrink-0 flex flex-col"
                >
                    <SectionList />
                </div>

                {/* Center: Canvas */}
                <div className="flex-1 bg-[#050510] overflow-auto flex items-start justify-center p-8 relative">
                    <div className={`transition-all duration-300 bg-white shadow-2xl overflow-hidden border border-white/5 ${deviceMode === 'mobile' ? 'w-[390px] rounded-[2rem]' : 'w-full max-w-[1280px] rounded-xl'}`}>
                        <CanvasRenderer />
                    </div>
                </div>

                {/* Right Panel: Properties */}
                <div className="w-72 border-l border-white/5 bg-[#0a0a0f] overflow-y-auto shrink-0">
                    <PropEditor />
                </div>
            </div>
        </div>
    );
}
