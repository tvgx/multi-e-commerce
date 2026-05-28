import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, UIComponentRef } from '@ecommerce/schema';

export type DeviceMode = 'desktop' | 'mobile';

interface BuilderStoreState extends BuilderState {
    activeComponentId: string | null;
    activePage: string;
    deviceMode: DeviceMode;
    isLoading: boolean;

    // Actions
    setTheme: (themePatch: Record<string, any>) => void;
    updateGlobalComponent: (id: string, props: Record<string, any>) => void;
    addPageSection: (pageType: string, componentId: string) => void;
    removePageSection: (pageType: string, id: string) => void;
    updatePageSection: (pageType: string, id: string, newProps: Record<string, any>) => void;
    reorderPageSections: (pageType: string, startIndex: number, endIndex: number) => void;
    
    setActiveComponent: (id: string | null) => void;
    setActivePage: (page: string) => void;
    setDeviceMode: (mode: DeviceMode) => void;

    // API
    loadTemplate: (shopId: string, token?: string) => Promise<void>;
    saveTemplate: (shopId: string, token?: string) => Promise<void>;
}

export const useBuilderStore = create<BuilderStoreState>((set, get) => ({
    globalComponents: [],
    pages: { home: [] },
    theme: {},
    
    activeComponentId: null,
    activePage: 'home',
    deviceMode: 'desktop',
    isLoading: false,

    setTheme: (themePatch) => set((state) => ({
        theme: { ...state.theme, ...themePatch }
    })),

    updateGlobalComponent: (id, props) => set((state) => ({
        globalComponents: state.globalComponents.map((c) =>
            c.id === id ? { ...c, props: { ...c.props, ...props } } : c
        )
    })),

    addPageSection: (pageType, componentId) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) pages[pageType] = [];
        
        pages[pageType] = [
            ...pages[pageType],
            { id: uuidv4(), componentId, props: {}, order: pages[pageType].length }
        ];

        return { pages, activeComponentId: null };
    }),

    removePageSection: (pageType, id) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;

        pages[pageType] = pages[pageType].filter((c) => c.id !== id);
        
        return { 
            pages, 
            activeComponentId: state.activeComponentId === id ? null : state.activeComponentId 
        };
    }),

    updatePageSection: (pageType, id, newProps) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;

        pages[pageType] = pages[pageType].map((c) =>
            c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
        );

        return { pages };
    }),

    reorderPageSections: (pageType, startIndex, endIndex) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;

        const newComponents = Array.from(pages[pageType]);
        const [removed] = newComponents.splice(startIndex, 1);
        newComponents.splice(endIndex, 0, removed);
        
        // Update order fields
        newComponents.forEach((c, index) => c.order = index);

        pages[pageType] = newComponents;
        return { pages };
    }),

    setActiveComponent: (id) => set({ activeComponentId: id }),
    setActivePage: (page) => set({ activePage: page }),
    setDeviceMode: (mode) => set({ deviceMode: mode }),

    loadTemplate: async (shopId: string, token?: string) => {
        set({ isLoading: true });
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Fetch Global Layout
            const globalRes = await fetch(`http://localhost:3000/api/layout/global/${shopId}`, { headers });
            let globalData: any = null;
            if (globalRes.ok) {
                const json = await globalRes.json();
                globalData = json.data;
            }

            // Fetch Page Layout (home)
            const pageRes = await fetch(`http://localhost:3000/api/layout/page/${shopId}/home`, { headers });
            let pageData: any = null;
            if (pageRes.ok) {
                const json = await pageRes.json();
                pageData = json.data;
            }

            const defaultGlobalComponents = [
                { id: 'global-header', componentId: 'Header', props: {} },
                { id: 'global-footer', componentId: 'Footer', props: {} }
            ];

            set({
                globalComponents: globalData?.globalComponents?.length ? globalData.globalComponents : defaultGlobalComponents,
                theme: globalData?.theme || {},
                pages: {
                    home: pageData?.components || []
                },
                isLoading: false
            });
        } catch (error) {
            console.error("Failed to load layout", error);
            set({ isLoading: false });
        }
    },

    saveTemplate: async (shopId: string, token?: string) => {
        const state = get();
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Save Global Layout (Theme + Global Components)
            await fetch(`http://localhost:3000/api/layout/global/${shopId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    theme: state.theme,
                    globalComponents: state.globalComponents
                })
            });

            // Save Page Layout (home)
            await fetch(`http://localhost:3000/api/layout/page/${shopId}/home`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    components: state.pages['home'] || []
                })
            });

        } catch (error) {
            console.error("Failed to save layout", error);
        }
    }
}));
