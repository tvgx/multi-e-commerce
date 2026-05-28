"use client"

import React from "react";
import { useBuilderStore } from "../../store/builder-store";
import { Settings, Image as ImageIcon, Link, AlignLeft } from "lucide-react";

export function PropertiesEditor() {
    const { 
        globalComponents, 
        pages, 
        activePage, 
        activeComponentId, 
        setActiveComponent, 
        updateGlobalComponent, 
        updatePageSection 
    } = useBuilderStore();

    if (!activeComponentId) {
        return (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
                <Settings className="h-8 w-8 mb-3 opacity-50" />
                <p>Select a section from the canvas or sidebar to edit its properties.</p>
            </div>
        );
    }

    const activeGlobal = globalComponents.find(c => c.id === activeComponentId);
    const activePageSection = (pages[activePage] || []).find(c => c.id === activeComponentId);
    const activeComponent = activeGlobal || activePageSection;

    if (!activeComponent) return null;

    const handlePropChange = (key: string, value: unknown) => {
        if (activeGlobal) {
            updateGlobalComponent(activeComponentId, { [key]: value });
        } else if (activePageSection) {
            updatePageSection(activePage, activeComponentId, { [key]: value });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    Editing {activeComponent.componentId}
                </h3>
                <button
                    onClick={() => setActiveComponent(null)}
                    className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 bg-zinc-800 rounded"
                >
                    Done
                </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
                {renderEditorFields(activeComponent.componentId, activeComponent.props || {}, handlePropChange)}
            </div>
        </div>
    );
}

function renderEditorFields(
    componentId: string,
    currentProps: Record<string, unknown>,
    onChange: (key: string, val: unknown) => void
) {
    // We mock the schema of what is editable for each component type
    switch (componentId) {
        case 'Header':
            return (
                <>
                    <InputField
                        label="Logo Text"
                        value={(currentProps.logoText as string) || "My Store"}
                        onChange={(v) => onChange('logoText', v)}
                        icon={<TypeIcon />}
                    />
                    <ImageUploadField
                        label="Logo Image"
                        value={(currentProps.logoImage as string) || ""}
                        onChange={(v) => onChange('logoImage', v)}
                        icon={<ImageIcon className="w-4 h-4" />}
                    />
                </>
            );
        case 'Footer':
            return (
                <>
                    <TextAreaField
                        label="About Us Text"
                        value={(currentProps.aboutText as string) || "We sell the best products in the world."}
                        onChange={(v) => onChange('aboutText', v)}
                        icon={<AlignLeft className="w-4 h-4" />}
                    />
                </>
            );
        case 'Hero':
            return (
                <>
                    <InputField
                        label="Heading"
                        value={(currentProps.title as string) || "Welcome to Duck Store"}
                        onChange={(v) => onChange('title', v)}
                        icon={<TypeIcon />}
                    />
                    <TextAreaField
                        label="Subheading"
                        value={(currentProps.subtitle as string) || "Built with our No-Code platform."}
                        onChange={(v) => onChange('subtitle', v)}
                        icon={<AlignLeft className="w-4 h-4" />}
                    />
                    <InputField
                        label="Button Text"
                        value={(currentProps.ctaText as string) || "Shop Now"}
                        onChange={(v) => onChange('ctaText', v)}
                    />
                    <InputField
                        label="Button Link"
                        value={(currentProps.ctaLink as string) || "#"}
                        onChange={(v) => onChange('ctaLink', v)}
                        icon={<Link className="w-4 h-4" />}
                    />
                    <ImageUploadField
                        label="Background Image"
                        value={(currentProps.backgroundImageUrl as string) || ""}
                        onChange={(v) => onChange('backgroundImageUrl', v)}
                        icon={<ImageIcon className="w-4 h-4" />}
                    />
                    <ColorPickerField
                        label="Background Color"
                        value={(currentProps.backgroundColor as string) || "#ffffff"}
                        onChange={(v) => onChange('backgroundColor', v)}
                        icon={<Settings className="w-4 h-4" />}
                    />
                </>
            );
        case 'AnnouncementBar':
            return (
                <>
                    <InputField
                        label="Announcement Text"
                        value={(currentProps.text as string) || "Free shipping on orders over $100!"}
                        onChange={(v) => onChange('text', v)}
                        icon={<TypeIcon />}
                    />
                    <ColorPickerField
                        label="Background Color"
                        value={(currentProps.backgroundColor as string) || "#000000"}
                        onChange={(v) => onChange('backgroundColor', v)}
                        icon={<Settings className="w-4 h-4" />}
                    />
                    <ColorPickerField
                        label="Text Color"
                        value={(currentProps.textColor as string) || "#ffffff"}
                        onChange={(v) => onChange('textColor', v)}
                        icon={<TypeIcon />}
                    />
                </>
            );
        case 'FeaturedCollection':
            return (
                <>
                    <InputField
                        label="Collection Title"
                        value={(currentProps.title as string) || "Featured Items"}
                        onChange={(v) => onChange('title', v)}
                    />
                    <TextAreaField
                        label="Description"
                        value={(currentProps.description as string) || "Handpicked selections."}
                        onChange={(v) => onChange('description', v)}
                    />

                    {/* Note: In a real app, products would be selected via a Product Picker modal */}
                    <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-md mt-4">
                        <p className="text-sm text-zinc-400 mb-2">Products (Mocked Preview)</p>
                        <button className="w-full py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors">
                            Change Collection Data
                        </button>
                    </div>
                </>
            );
        default:
            return <p className="text-zinc-500 text-sm">No settings available for this component.</p>;
    }
}

// Simple internal UI components for the editor forms
interface FieldProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    icon?: React.ReactNode;
    placeholder?: string;
}

function InputField({ label, value, onChange, icon, placeholder }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                {icon} {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
            />
        </div>
    );
}

function TextAreaField({ label, value, onChange, icon }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                {icon} {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow resize-none"
            />
        </div>
    );
}

function ColorPickerField({ label, value, onChange, icon }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                {icon} {label}
            </label>
            <div className="flex gap-3 items-center">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded border-none outline-none cursor-pointer p-0 bg-transparent"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            </div>
        </div>
    );
}

function ImageUploadField({ label, value, onChange, icon }: FieldProps) {
    // A mock image upload field that uses FileReader to get a local data URL 
    // or allows manual URL input.
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Use FileReader for instant preview instead of actual upload to keep it simple in UI package
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                onChange(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                {icon} {label}
            </label>
            {value && (
                <div className="mb-2 relative rounded-md overflow-hidden border border-zinc-700 bg-zinc-900 group">
                    <img src={value} alt="Preview" className="w-full h-32 object-cover" />
                    <button 
                        onClick={() => onChange('')}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-md border border-zinc-700 cursor-pointer flex items-center justify-center transition-colors">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
            </div>
        </div>
    );
}

function TypeIcon() {
    return <span className="font-serif text-[10px] bg-zinc-700 px-1 rounded inline-block font-bold">Ag</span>;
}
