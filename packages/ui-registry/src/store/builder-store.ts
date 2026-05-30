import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, UIComponentRef } from '@ecommerce/schema';

export type DeviceMode = 'desktop' | 'mobile';

interface BuilderStoreState extends BuilderState {
    activeComponentId: string | null;
    activePage: string;
    deviceMode: DeviceMode;
    isLoading: boolean;
    
    // New Editor State
    isEditorOpen: boolean;
    pendingProps: Record<string, unknown> | null;
    defaultImages: string[];

    // Actions
    setTheme: (themePatch: Record<string, any>) => void;
    updateGlobalComponent: (id: string, props: Record<string, any>) => void;
    addPageSection: (pageType: string, componentId: string, insertIndex?: number) => void;
    removePageSection: (pageType: string, id: string) => void;
    updatePageSection: (pageType: string, id: string, newProps: Record<string, any>) => void;
    reorderPageSections: (pageType: string, startIndex: number, endIndex: number) => void;
    
    setActiveComponent: (id: string | null) => void;
    setActivePage: (page: string) => void;
    setDeviceMode: (mode: DeviceMode) => void;

    // Editor Actions
    openSectionEditor: (id: string) => void;
    closeSectionEditor: () => void;
    setPendingProp: (key: string, value: unknown) => void;
    commitPendingProps: () => void;
    discardPendingProps: () => void;
    fetchDefaultImages: () => Promise<void>;

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

    isEditorOpen: false,
    pendingProps: null,
    defaultImages: [],

    setTheme: (themePatch) => set((state) => ({
        theme: { ...state.theme, ...themePatch }
    })),

    updateGlobalComponent: (id, props) => set((state) => ({
        globalComponents: state.globalComponents.map((c) =>
            c.id === id ? { ...c, props: { ...c.props, ...props } } : c
        )
    })),

    addPageSection: (pageType, componentId, insertIndex) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) pages[pageType] = [];
        
        // Inject default background images if available
        const imgs = state.defaultImages;
        let props: any = {};
        if (imgs && imgs.length > 0) {
            props.backgroundImageUrl = imgs[Math.floor(Math.random() * imgs.length)];
            props.images = [imgs[0], imgs[1], imgs[2], imgs[3]]; // In case component expects array
        }

        const newNode = { id: uuidv4(), componentId, props, order: 0 };
        
        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= pages[pageType].length) {
             const newArray = [...pages[pageType]];
             newArray.splice(insertIndex, 0, newNode);
             // Reorder
             newArray.forEach((c, index) => c.order = index);
             pages[pageType] = newArray;
        } else {
             newNode.order = pages[pageType].length;
             pages[pageType] = [...pages[pageType], newNode];
        }

        return { pages, activeComponentId: null };
    }),

    removePageSection: (pageType, id) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;

        pages[pageType] = pages[pageType].filter((c) => c.id !== id);
        
        return { 
            pages, 
            activeComponentId: state.activeComponentId === id ? null : state.activeComponentId,
            isEditorOpen: state.activeComponentId === id ? false : state.isEditorOpen
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

    openSectionEditor: (id) => {
        const state = get();
        // find the component to get initial props
        const comp = state.globalComponents.find(c => c.id === id) || 
                     (state.pages[state.activePage] || []).find(c => c.id === id);
        
        set({ 
            activeComponentId: id, 
            isEditorOpen: true,
            pendingProps: comp ? { ...comp.props } : {}
        });
    },

    closeSectionEditor: () => set({ 
        isEditorOpen: false, 
        activeComponentId: null, 
        pendingProps: null 
    }),

    setPendingProp: (key, value) => set((state) => ({
        pendingProps: state.pendingProps ? { ...state.pendingProps, [key]: value } : { [key]: value }
    })),

    commitPendingProps: () => set((state) => {
        if (!state.activeComponentId || !state.pendingProps) return state;

        // Try global first
        const isGlobal = state.globalComponents.some(c => c.id === state.activeComponentId);
        if (isGlobal) {
            return {
                globalComponents: state.globalComponents.map(c => 
                    c.id === state.activeComponentId ? { ...c, props: { ...c.props, ...state.pendingProps! } } : c
                ),
                pendingProps: null,
                isEditorOpen: false
            };
        }

        // Try pages
        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];
        pages[state.activePage] = activePageList.map(c => 
            c.id === state.activeComponentId ? { ...c, props: { ...c.props, ...state.pendingProps! } } : c
        );

        return { pages, pendingProps: null, isEditorOpen: false };
    }),

    discardPendingProps: () => set({ pendingProps: null, isEditorOpen: false, activeComponentId: null }),

    fetchDefaultImages: async () => {
        if (get().defaultImages.length > 0) return;
        const MINIO_BASE_URL = 'http://localhost:9000/assets'; // Assuming 'assets' bucket
        const urls = [
            `${MINIO_BASE_URL}/default-1.png`,
            `${MINIO_BASE_URL}/default-2.png`,
            `${MINIO_BASE_URL}/default-3.png`,
            `${MINIO_BASE_URL}/default-4.png`,
        ];
        set({ defaultImages: urls });
    },

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
