'use client';

import React, { useEffect, use } from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { SectionList } from '@/components/builder/SectionList';
import { PropEditor } from '@/components/builder/PropEditor';
import { PreviewIframe } from '@/components/builder/PreviewIframe';
import { ArrowLeft, Save, Loader2, Monitor, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function BuilderPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = use(params);
    const { loadTemplate, saveTemplate, isLoading, deviceMode, setDeviceMode } = useBuilderStore();
    const [saving, setSaving] = React.useState(false);

    useEffect(() => {
        // We might need to pass token here if admin API requires it,
        // but for now relying on existing loadTemplate signature
        loadTemplate(shopId);
    }, [loadTemplate, shopId]);

    const handleSave = async () => {
        setSaving(true);
        await saveTemplate(shopId);
        setSaving(false);
        // Optionally show toast
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
            <div className="h-14 border-b border-white/5 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link 
                        href={`/dashboard/${shopId}/online-store/themes`}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-sm font-bold">Theme Builder</div>
                </div>

                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button 
                        onClick={() => setDeviceMode('desktop')}
                        className={`p-1.5 rounded-md transition-colors ${deviceMode === 'desktop' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Monitor size={16} />
                    </button>
                    <button 
                        onClick={() => setDeviceMode('mobile')}
                        className={`p-1.5 rounded-md transition-colors ${deviceMode === 'mobile' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors font-bold text-sm disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save
                </button>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Sections List */}
                <div className="w-80 border-r border-white/5 bg-slate-900 overflow-y-auto shrink-0 flex flex-col">
                    <SectionList />
                </div>

                {/* Center: Preview Iframe */}
                <div className="flex-1 bg-[#030014] overflow-hidden flex items-center justify-center p-8 relative">
                    <PreviewIframe shopId={shopId} />
                </div>

                {/* Right Panel: Prop Editor */}
                <div className="w-80 border-l border-white/5 bg-slate-900 overflow-y-auto shrink-0">
                    <PropEditor />
                </div>
            </div>
        </div>
    );
}
