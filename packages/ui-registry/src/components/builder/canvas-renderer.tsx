"use client"

import React from "react";
import { useBuilderStore, Section } from "../../store/builder-store";
import { Hero, FeaturedCollection, AnnouncementBar } from "../../registry";
import { ComponentType } from "../../store/builder-store";

// Mapping between string 'type' and the actual React Component from UI Registry
const COMPONENT_REGISTRY: Record<ComponentType, React.ComponentType<any>> = {
    Hero,
    FeaturedCollection,
    AnnouncementBar,
};

// Default props defining the fallback layout if user hasn't overridden them
const DEFAULT_PROPS: Record<string, Record<string, unknown>> = {
    Hero: {
        title: "Welcome to Duck Store",
        subtitle: "Built with our No-Code platform.",
        ctaText: "Shop Now",
        ctaLink: "#",
    },
    FeaturedCollection: {
        title: "Featured Items",
        description: "Handpicked selections.",
        products: [
            { id: "p1", name: "Sample Item", price: 19.99, slug: "sample", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60" }
        ]
    },
    AnnouncementBar: {
        text: "Free shipping on orders over $100!",
    }
};

export function CanvasRenderer() {
    const { sections, activeSectionId, setActiveSection } = useBuilderStore();

    return (
        <div className="w-full min-h-[500px] pb-32 flex flex-col items-center">
            {sections.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center p-12 text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                    No sections added yet. Drag or click &quot;Add Section&quot; from the sidebar.
                </div>
            ) : (
                sections.map((section) => (
                    <CanvasBlock
                        key={section.id}
                        section={section}
                        isActive={activeSectionId === section.id}
                        onClick={() => setActiveSection(section.id)}
                    />
                ))
            )}
        </div>
    );
}

// Inner component to handle styling of "Active" vs "Inactive" states in Builder Mode
function CanvasBlock({
    section,
    isActive,
    onClick
}: {
    section: Section;
    isActive: boolean;
    onClick: () => void;
}) {
    const Component = COMPONENT_REGISTRY[section.type];

    if (!Component) {
        return <div className="p-4 bg-red-50 text-red-500">Unknown component: {section.type}</div>;
    }

    // Core logic: Merge the static Default Props with User's Override Props
    const mergedProps = {
        ...DEFAULT_PROPS[section.type],
        ...(section.props || {})  // Only override if user modified
    };

    return (
        <div
            className={`relative w-full group transition-all duration-200 cursor-pointer
        ${isActive ? 'ring-2 ring-emerald-500/80 ring-inset z-10' : 'hover:ring-2 hover:ring-blue-400/50 hover:ring-inset z-0'}
      `}
            onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling up to un-click
                onClick();
            }}
        >
            {/* Visual Indicator of Active/Edit mode */}
            {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-1 z-20 rounded-bl-lg pointer-events-none shadow-sm">
                    Editing {section.type}
                </div>
            )}

            {/* To allow clicks inside the canvas to select the component without triggering links, we wrapper it */}
            <div className="pointer-events-none">
                <Component {...mergedProps} />
            </div>
        </div>
    );
}
