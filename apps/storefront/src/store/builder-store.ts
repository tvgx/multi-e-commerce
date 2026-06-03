import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type ComponentType = 'Hero' | 'FeaturedCollection' | 'AnnouncementBar';

export interface Section {
    id: string;
    type: ComponentType;
    props?: Record<string, any>;
}

interface BuilderState {
    sections: Section[];
    activeSectionId: string | null;
    deviceMode: 'desktop' | 'mobile';

    // Actions
    addSection: (type: ComponentType) => void;
    removeSection: (id: string) => void;
    updateSectionProps: (id: string, newProps: Record<string, any>) => void;
    reorderSections: (startIndex: number, endIndex: number) => void;
    setActiveSection: (id: string | null) => void;
    setDeviceMode: (mode: 'desktop' | 'mobile') => void;

    // API Integration
    loadTemplate: (shopId: string) => Promise<void>;
    saveTemplate: (shopId: string) => Promise<void>;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
    sections: [], // Start empty, handle loading state in components
    activeSectionId: null,
    deviceMode: 'desktop',

    addSection: (type) => set((state) => ({
        sections: [...state.sections, { id: uuidv4(), type }],
        activeSectionId: null // Focus out when adding new for now
    })),

    removeSection: (id) => set((state) => ({
        sections: state.sections.filter((s) => s.id !== id),
        activeSectionId: state.activeSectionId === id ? null : state.activeSectionId
    })),

    updateSectionProps: (id, newProps) => set((state) => ({
        sections: state.sections.map((s) =>
            s.id === id ? { ...s, props: { ...s.props, ...newProps } } : s
        )
    })),

    reorderSections: (startIndex, endIndex) => set((state) => {
        const newSections = Array.from(state.sections);
        const [removed] = newSections.splice(startIndex, 1);
        newSections.splice(endIndex, 0, removed);
        return { sections: newSections };
    }),

    setActiveSection: (id) => set({ activeSectionId: id }),
    setDeviceMode: (mode) => set({ deviceMode: mode }),

    loadTemplate: async (shopId: string) => {
        try {
            const response = await fetch(`${getApiUrl()}/api/shops/${shopId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.uiStructure && data.uiStructure.sections) {
                    set({
                        sections: data.uiStructure.sections,
                        deviceMode: data.uiStructure.deviceMode || 'desktop'
                    });
                } else {
                    // Fallback to defaults if no custom structure exists yet
                    set({
                        sections: [
                            { id: 'default-announcement', type: 'AnnouncementBar' },
                            { id: 'default-hero', type: 'Hero' },
                            { id: 'default-collection', type: 'FeaturedCollection' }
                        ]
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load template", error);
        }
    },

    saveTemplate: async (shopId: string) => {
        try {
            const state = get();
            const payload = {
                publishedData: {
                    sections: state.sections,
                    deviceMode: state.deviceMode
                }
            };

            // To be implemented on backend side (PUT /api/shops/:id)
            const response = await fetch(`${getApiUrl()}/api/shops/${shopId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error("Failed to save template");
            }
        } catch (error) {
            console.error("Failed to save template", error);
        }
    }
}));
