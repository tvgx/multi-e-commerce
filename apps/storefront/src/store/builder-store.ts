import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

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
}

export const useBuilderStore = create<BuilderState>((set) => ({
    sections: [
        { id: 'default-announcement', type: 'AnnouncementBar' },
        { id: 'default-hero', type: 'Hero' },
        { id: 'default-collection', type: 'FeaturedCollection' }
    ],
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
    setDeviceMode: (mode) => set({ deviceMode: mode })
}));
