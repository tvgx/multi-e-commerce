'use client';

import React from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { schemaRegistry } from '@ecommerce/ui-registry/src/registry';
import { Settings2, Type, Image as ImageIcon, Link as LinkIcon, Palette, AlignLeft, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';

function findNodeRecursive(nodes: any[], id: string): any | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.blocks && node.blocks.length > 0) {
            const found = findNodeRecursive(node.blocks, id);
            if (found) return found;
        }
    }
    return null;
}

export function PropEditor() {
    const { pages, activePage, activeComponentId, activeBlockId, globalComponents, updatePageSection, updateGlobalComponent, updateBlockProp } = useBuilderStore();
    const [isUploading, setIsUploading] = React.useState(false);
    const { shopId } = useParams() as { shopId: string };
    
    let targetId = activeBlockId || activeComponentId;

    if (!targetId) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center text-slate-500">
                <Settings2 className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a section or block to edit its properties</p>
            </div>
        );
    }

    const sections = pages[activePage] || [];
    const allRoots = [...globalComponents, ...sections];
    const targetNode = findNodeRecursive(allRoots, targetId);
    
    if (!targetNode) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center text-slate-500">
                <Settings2 className="w-12 h-12 mb-4 opacity-50" />
                <p>Node not found</p>
            </div>
        );
    }

    const schema = schemaRegistry[targetNode.componentId] || {};
    const fields = schema?.settings || schema?.fields;

    if (!fields || fields.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/5 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Settings2 size={18} className="text-indigo-400" />
                        {schema.title || targetNode.componentId}
                    </h3>
                </div>
                <div className="p-6 text-slate-400">
                    <p>No configurable properties for this component.</p>
                </div>
            </div>
        );
    }

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
            
            const token = localStorage.getItem('accessToken') || '';
            const res = await fetch('http://localhost:3000/api/media/upload', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'x-shop-id': shopId
                },
                body: formData
            });
            
            if (res.ok) {
                const json = await res.json();
                if (json.data && json.data.url) {
                    handlePropChange(fieldId, json.data.url);
                }
            } else {
                alert('Upload failed');
            }
        } catch (e) {
            console.error(e);
            alert('Upload error');
        } finally {
            setIsUploading(false);
        }
    };

    const renderField = (field: any, currentValue: any) => {
        const fieldId = field.id || field.name;
        const id = `field-${fieldId}`;
        const label = field.label || field.name;
        
        switch (field.type) {
            case 'text':
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Type size={14} /> {label}
                        </label>
                        <input 
                            id={id}
                            type="text" 
                            value={currentValue ?? field.default ?? ''}
                            onChange={(e) => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
            case 'textarea':
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <AlignLeft size={14} /> {label}
                        </label>
                        <textarea 
                            id={id}
                            rows={4}
                            value={currentValue ?? field.default ?? ''}
                            onChange={(e) => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors resize-y"
                        />
                    </div>
                );
            case 'image':
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon size={14} /> {label}
                        </label>
                        <div className="flex gap-2">
                            <input 
                                id={id}
                                type="text" 
                                value={currentValue ?? field.default ?? ''}
                                onChange={(e) => handlePropChange(fieldId, e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                                placeholder="https://"
                            />
                            <label className={`flex items-center justify-center p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload size={18} className="text-white" />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload(fieldId, file);
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                );
            case 'color':
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Palette size={14} /> {label}
                        </label>
                        <div className="flex items-center gap-3">
                            <input 
                                id={id}
                                type="color" 
                                value={currentValue ?? field.default ?? '#000000'}
                                onChange={(e) => handlePropChange(fieldId, e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input 
                                type="text" 
                                value={currentValue ?? field.default ?? ''}
                                onChange={(e) => handlePropChange(fieldId, e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors font-mono uppercase"
                            />
                        </div>
                    </div>
                );
            case 'boolean':
                return (
                    <div className="flex items-center justify-between py-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {label}
                        </label>
                        <input 
                            id={id}
                            type="checkbox" 
                            checked={currentValue ?? field.default ?? false}
                            onChange={(e) => handlePropChange(fieldId, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                );
            case 'select':
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {label}
                        </label>
                        <select 
                            id={id}
                            value={currentValue ?? field.default ?? ''}
                            onChange={(e) => handlePropChange(fieldId, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
                        >
                            {field.options?.map((opt: any) => (
                                <option key={opt.value || opt} value={opt.value || opt}>
                                    {opt.label || opt}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case 'segmented':
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {label}
                        </label>
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            {field.options?.map((opt: any) => {
                                const val = opt.value || opt;
                                const optLabel = opt.label || opt;
                                const isSelected = (currentValue ?? field.default) === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handlePropChange(fieldId, val)}
                                        className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        {optLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-2">
                        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {label} ({field.type})
                        </label>
                        <textarea 
                            id={id}
                            rows={3}
                            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue ?? ''}
                            onChange={(e) => {
                                try {
                                    handlePropChange(fieldId, JSON.parse(e.target.value));
                                } catch {
                                    handlePropChange(fieldId, e.target.value);
                                }
                            }}
                            className="w-full bg-slate-800 border border-slate-700 text-xs font-mono rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f]">
            <div className="p-4 border-b border-white/5 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Settings2 size={18} className="text-indigo-400" />
                    {schema.title || targetNode.componentId}
                </h3>
                {schema.description && (
                    <p className="text-xs text-slate-400 mt-1">{schema.description}</p>
                )}
            </div>
            
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                {fields.map((field: any) => {
                    const fieldId = field.id || field.name;
                    return (
                        <div key={fieldId}>
                            {renderField(field, targetNode.props?.[fieldId])}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
