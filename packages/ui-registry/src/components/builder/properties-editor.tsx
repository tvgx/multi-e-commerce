"use client"

import React from "react";
import { useBuilderStore, ComponentType } from "../../store/builder-store";
import { Settings, Image as ImageIcon, Link, AlignLeft } from "lucide-react";

export function PropertiesEditor() {
    const { sections, activeSectionId, updateSectionProps, setActiveSection } = useBuilderStore();

    if (!activeSectionId) {
        return (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
                <Settings className="h-8 w-8 mb-3 opacity-50" />
                <p>Select a section from the canvas or sidebar to edit its properties.</p>
            </div>
        );
    }

    const activeSection = sections.find(s => s.id === activeSectionId);
    if (!activeSection) return null;

    const handlePropChange = (key: string, value: unknown) => {
        updateSectionProps(activeSectionId, { [key]: value });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    Editing {activeSection.type}
                </h3>
                <button
                    onClick={() => setActiveSection(null)}
                    className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 bg-zinc-800 rounded"
                >
                    Done
                </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
                {renderEditorFields(activeSection.type, activeSection.props || {}, handlePropChange)}
            </div>
        </div>
    );
}

function renderEditorFields(
    type: ComponentType,
    currentProps: Record<string, unknown>,
    onChange: (key: string, val: unknown) => void
) {
    // We mock the schema of what is editable for each component type
    switch (type) {
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
                    <InputField
                        label="Background Image URL"
                        value={(currentProps.backgroundImageUrl as string) || ""}
                        onChange={(v) => onChange('backgroundImageUrl', v)}
                        icon={<ImageIcon className="w-4 h-4" />}
                        placeholder="https://..."
                    />
                </>
            );
        case 'AnnouncementBar':
            return (
                <InputField
                    label="Announcement Text"
                    value={(currentProps.text as string) || "Free shipping on orders over $100!"}
                    onChange={(v) => onChange('text', v)}
                    icon={<TypeIcon />}
                />
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

function TypeIcon() {
    return <span className="font-serif text-[10px] bg-zinc-700 px-1 rounded inline-block font-bold">Ag</span>;
}
