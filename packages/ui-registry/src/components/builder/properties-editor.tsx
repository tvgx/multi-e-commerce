"use client"

import React from "react";
import { useBuilderStore } from "../../store/builder-store";
import { Settings } from "lucide-react";
import { schemaRegistry } from "../../registry";
import { UIComponentRef } from "@ecommerce/schema";
import { 
    SliderControl, 
    SegmentedControl, 
    PageSelectorControl, 
    ColorPickerControl, 
    ResourcePickerControl, 
    TextControl, 
    SelectControl 
} from "./controls";

function findComponentById(components: UIComponentRef[], id: string): UIComponentRef | null {
    for (const c of components) {
        if (c.id === id) return c;
        if (c.blocks) {
            const found = findComponentById(c.blocks, id);
            if (found) return found;
        }
    }
    return null;
}

export function PropertiesEditor() {
    const { 
        globalComponents, 
        pages, 
        activePage, 
        activeComponentId, 
        activeBlockId,
        setActiveComponent,
        setActiveBlock,
        updateBlockProp
    } = useBuilderStore();

    const activeTargetId = activeBlockId || activeComponentId;

    if (!activeTargetId) {
        return (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
                <Settings className="h-8 w-8 mb-3 opacity-50" />
                <p>Chọn một phần tử từ Canvas hoặc Sidebar trái để chỉnh sửa.</p>
            </div>
        );
    }

    const allComponents = [...globalComponents, ...(pages[activePage] || [])];
    const activeComponent = findComponentById(allComponents, activeTargetId);

    if (!activeComponent) {
        return null;
    }

    const schema = schemaRegistry[activeComponent.componentId];

    const handlePropChange = (key: string, value: any) => {
        updateBlockProp(activeTargetId, key, value);
    };

    const handleDone = () => {
        if (activeBlockId) {
            setActiveBlock(null);
        } else {
            setActiveComponent(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <div>
                    <h3 className="font-semibold text-white">
                        {schema?.name || activeComponent.componentId}
                    </h3>
                    {schema?.category && (
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                            {schema.category}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleDone}
                    className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 bg-zinc-800 rounded"
                >
                    Xong
                </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
                {!schema || !schema.settings || schema.settings.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Không có thuộc tính nào để tùy chỉnh cho thành phần này.</p>
                ) : (
                    schema.settings.map((setting: any) => {
                        const value = (activeComponent.props || {})[setting.id];
                        
                        switch (setting.type) {
                            case 'text':
                                return <TextControl key={setting.id} label={setting.label} value={value} onChange={(v) => handlePropChange(setting.id, v)} />;
                            case 'slider':
                                return <SliderControl key={setting.id} label={setting.label} value={value} min={setting.min} max={setting.max} onChange={(v) => handlePropChange(setting.id, v)} />;
                            case 'segmented':
                                return <SegmentedControl key={setting.id} label={setting.label} value={value} options={setting.options} onChange={(v) => handlePropChange(setting.id, v)} />;
                            case 'select':
                                return <SelectControl key={setting.id} label={setting.label} value={value} options={setting.options} onChange={(v) => handlePropChange(setting.id, v)} />;
                            case 'color':
                                return <ColorPickerControl key={setting.id} label={setting.label} value={value} onChange={(v) => handlePropChange(setting.id, v)} />;
                            case 'resource_picker':
                                return <ResourcePickerControl key={setting.id} label={setting.label} value={value} onChange={(v) => handlePropChange(setting.id, v)} />;
                            case 'page_selector':
                                return <PageSelectorControl key={setting.id} label={setting.label} value={value} onChange={(v) => handlePropChange(setting.id, v)} />;
                            default:
                                return null;
                        }
                    })
                )}
            </div>
        </div>
    );
}
