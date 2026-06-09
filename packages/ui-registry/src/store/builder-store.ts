import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, UIComponentRef } from '@ecommerce/schema';
import { ComponentSchemas } from '../component-schemas';

export type DeviceMode = 'desktop' | 'mobile';

interface HistorySnapshot {
    globalComponents: UIComponentRef[];
    pages: Record<string, UIComponentRef[]>;
    theme: Record<string, any>;
}

interface BuilderStoreState extends BuilderState {
    activeComponentId: string | null;
    activeBlockId: string | null;
    activePage: string;
    deviceMode: DeviceMode;
    isLoading: boolean;
    availableSchemas: any[];
    defaultImages: string[];
    history: { past: HistorySnapshot[]; future: HistorySnapshot[] };

    // Actions
    setTheme: (themePatch: Record<string, any>) => void;
    updateGlobalComponent: (id: string, props: Record<string, any>) => void;
    addPageSection: (pageType: string, componentId: string, insertIndex?: number) => void;
    removePageSection: (pageType: string, id: string) => void;
    updatePageSection: (pageType: string, id: string, newProps: Record<string, any>) => void;
    reorderPageSections: (pageType: string, startIndex: number, endIndex: number) => void;

    // Selection
    setActiveComponent: (id: string | null) => void;
    setActiveBlock: (id: string | null) => void;
    setActivePage: (page: string) => void;
    setDeviceMode: (mode: DeviceMode) => void;

    // Real-time prop editing
    updateComponentProp: (id: string, propKey: string, value: any) => void;
    updateBlockProp: (blockId: string, propKey: string, value: any) => void;

    // Block management
    addBlock: (parentId: string, blockComponentId: string) => void;
    removeBlock: (blockId: string) => void;
    toggleBlockVisibility: (blockId: string) => void;
    reorderBlocks: (parentId: string, startIndex: number, endIndex: number) => void;

    // History
    undo: () => void;
    redo: () => void;

    // Helpers
    fetchDefaultImages: () => Promise<void>;

    // API
    loadTemplate: (shopId: string, token?: string) => Promise<void>;
    saveTemplate: (shopId: string, token?: string) => Promise<void>;
    publishTemplate: (shopId: string, token?: string) => Promise<void>;
}

// -----------------------------------------------------------------------
// Recursive helpers
// -----------------------------------------------------------------------
function mapRecursive(components: UIComponentRef[], targetId: string, updater: (c: UIComponentRef) => UIComponentRef): UIComponentRef[] {
    return components.map(c => {
        if (c.id === targetId) return updater(c);
        if (c.blocks && c.blocks.length > 0) return { ...c, blocks: mapRecursive(c.blocks, targetId, updater) };
        return c;
    });
}

function filterRecursive(components: UIComponentRef[], targetId: string): UIComponentRef[] {
    return components.filter(c => c.id !== targetId).map(c => {
        if (c.blocks && c.blocks.length > 0) return { ...c, blocks: filterRecursive(c.blocks, targetId) };
        return c;
    });
}

// -----------------------------------------------------------------------
// History helpers
// -----------------------------------------------------------------------
function snapshot(state: BuilderStoreState): HistorySnapshot {
    return {
        globalComponents: JSON.parse(JSON.stringify(state.globalComponents)),
        pages: JSON.parse(JSON.stringify(state.pages)),
        theme: { ...state.theme },
    };
}

function pushHistory(state: BuilderStoreState): Pick<BuilderStoreState, 'history'> {
    return {
        history: {
            past: [...state.history.past.slice(-49), snapshot(state)],
            future: [],
        },
    };
}

// Default MinIO images used when defaultImages hasn't been fetched yet
const MINIO_DEFAULTS = [
    'http://localhost:9000/assets/default-1.png',
    'http://localhost:9000/assets/default-2.png',
    'http://localhost:9000/assets/default-3.png',
    'http://localhost:9000/assets/default-4.png',
];

// -----------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------
export const useBuilderStore = create<BuilderStoreState>((set, get) => ({
    globalComponents: [],
    pages: { home: [] },
    theme: {},

    activeComponentId: null,
    activeBlockId: null,
    activePage: 'home',
    deviceMode: 'desktop',
    isLoading: false,
    availableSchemas: [],
    defaultImages: [],
    history: { past: [], future: [] },

    // -----------------------------------------------------------------------
    setTheme: (themePatch) => set((state) => ({
        ...pushHistory(state),
        theme: { ...state.theme, ...themePatch },
    })),

    updateGlobalComponent: (id, props) => set((state) => {
        const hist = pushHistory(state);
        if (props.shopName !== undefined) {
            return {
                ...hist,
                theme: { ...state.theme, shopName: props.shopName },
                globalComponents: state.globalComponents.map((c) =>
                    (c.componentId === 'Header' || c.componentId === 'Footer')
                        ? { ...c, props: { ...c.props, ...props, shopName: props.shopName } }
                        : (c.id === id ? { ...c, props: { ...c.props, ...props } } : c)
                ),
            };
        }
        return {
            ...hist,
            globalComponents: state.globalComponents.map((c) =>
                c.id === id ? { ...c, props: { ...c.props, ...props } } : c
            ),
        };
    }),

    addPageSection: (pageType, componentId, insertIndex) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        if (!pages[pageType]) pages[pageType] = [];

        const imgs = state.defaultImages.length > 0 ? state.defaultImages : MINIO_DEFAULTS;
        let props: any = {};
        props.backgroundImageUrl = imgs[Math.floor(Math.random() * imgs.length)];

        const schema = ComponentSchemas[componentId];
        let defaultBlocks: UIComponentRef[] = [];
        if (schema?.defaultBlocks?.length) {
            defaultBlocks = schema.defaultBlocks.map((b, i) => {
                const blockProps = { ...(b.props || {}) };
                if (b.componentId === 'SlideItem') {
                    blockProps.backgroundImageUrl = imgs[i % imgs.length];
                }
                return {
                    id: uuidv4(),
                    componentId: b.componentId,
                    type: 'block' as const,
                    props: blockProps,
                    order: i,
                };
            });
        }

        const newNode: UIComponentRef = {
            id: uuidv4(),
            componentId,
            props,
            order: 0,
            type: 'section',
            blocks: defaultBlocks.length ? defaultBlocks : undefined,
        };

        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= pages[pageType].length) {
            const newArray = [...pages[pageType]];
            newArray.splice(insertIndex, 0, newNode);
            newArray.forEach((c, i) => c.order = i);
            pages[pageType] = newArray;
        } else {
            newNode.order = pages[pageType].length;
            pages[pageType] = [...pages[pageType], newNode];
        }

        return { ...hist, pages, activeComponentId: newNode.id, activeBlockId: null };
    }),

    removePageSection: (pageType, id) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;
        pages[pageType] = pages[pageType].filter((c) => c.id !== id);
        return {
            ...hist,
            pages,
            activeComponentId: state.activeComponentId === id ? null : state.activeComponentId,
            activeBlockId: state.activeComponentId === id ? null : state.activeBlockId,
        };
    }),

    updatePageSection: (pageType, id, newProps) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;
        pages[pageType] = pages[pageType].map((c) =>
            c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
        );
        return { ...hist, pages };
    }),

    reorderPageSections: (pageType, startIndex, endIndex) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;
        const arr = Array.from(pages[pageType]);
        const [removed] = arr.splice(startIndex, 1);
        arr.splice(endIndex, 0, removed);
        arr.forEach((c, i) => c.order = i);
        pages[pageType] = arr;
        return { ...hist, pages };
    }),

    setActiveComponent: (id) => set({ activeComponentId: id, activeBlockId: null }),
    setActiveBlock: (id) => set({ activeBlockId: id }),
    setActivePage: (page) => set({ activePage: page }),
    setDeviceMode: (mode) => set({ deviceMode: mode }),

    updateComponentProp: (id, propKey, value) => set((state) => {
        const hist = pushHistory(state);
        const isGlobal = state.globalComponents.some(c => c.id === id);
        if (isGlobal) {
            return {
                ...hist,
                globalComponents: state.globalComponents.map(c =>
                    c.id === id ? { ...c, props: { ...c.props, [propKey]: value } } : c
                ),
            };
        }
        const pages = { ...state.pages };
        const list = pages[state.activePage] || [];
        pages[state.activePage] = list.map(c =>
            c.id === id ? { ...c, props: { ...c.props, [propKey]: value } } : c
        );
        return { ...hist, pages };
    }),

    updateBlockProp: (blockId, propKey, value) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        const list = pages[state.activePage] || [];
        return {
            ...hist,
            globalComponents: mapRecursive(state.globalComponents, blockId, (c) => ({
                ...c, props: { ...c.props, [propKey]: value },
            })),
            pages: {
                ...pages,
                [state.activePage]: mapRecursive(list, blockId, (c) => ({
                    ...c, props: { ...c.props, [propKey]: value },
                })),
            },
        };
    }),

    addBlock: (parentId, blockComponentId) => set((state) => {
        const hist = pushHistory(state);
        const newBlock: UIComponentRef = {
            id: uuidv4(),
            componentId: blockComponentId,
            type: 'block',
            props: {},
            order: 0,
        };
        const updater = (c: UIComponentRef) => {
            const cur = c.blocks || [];
            newBlock.order = cur.length;
            return { ...c, blocks: [...cur, newBlock] };
        };
        const pages = { ...state.pages };
        const list = pages[state.activePage] || [];
        return {
            ...hist,
            globalComponents: mapRecursive(state.globalComponents, parentId, updater),
            pages: { ...pages, [state.activePage]: mapRecursive(list, parentId, updater) },
            activeBlockId: newBlock.id,
        };
    }),

    removeBlock: (blockId) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        const list = pages[state.activePage] || [];
        return {
            ...hist,
            globalComponents: filterRecursive(state.globalComponents, blockId),
            pages: { ...pages, [state.activePage]: filterRecursive(list, blockId) },
            activeBlockId: state.activeBlockId === blockId ? null : state.activeBlockId,
        };
    }),

    toggleBlockVisibility: (blockId) => set((state) => {
        const hist = pushHistory(state);
        const pages = { ...state.pages };
        const list = pages[state.activePage] || [];
        const updater = (c: UIComponentRef) => ({ ...c, isHidden: !c.isHidden });
        return {
            ...hist,
            globalComponents: mapRecursive(state.globalComponents, blockId, updater),
            pages: { ...pages, [state.activePage]: mapRecursive(list, blockId, updater) },
        };
    }),

    reorderBlocks: (parentId, startIndex, endIndex) => set((state) => {
        const hist = pushHistory(state);
        const updater = (c: UIComponentRef) => {
            if (!c.blocks) return c;
            const arr = Array.from(c.blocks);
            const [removed] = arr.splice(startIndex, 1);
            arr.splice(endIndex, 0, removed);
            arr.forEach((b, i) => b.order = i);
            return { ...c, blocks: arr };
        };
        const pages = { ...state.pages };
        const list = pages[state.activePage] || [];
        return {
            ...hist,
            globalComponents: mapRecursive(state.globalComponents, parentId, updater),
            pages: { ...pages, [state.activePage]: mapRecursive(list, parentId, updater) },
        };
    }),

    // -----------------------------------------------------------------------
    // Undo / Redo
    // -----------------------------------------------------------------------
    undo: () => set((state) => {
        if (state.history.past.length === 0) return state;
        const prev = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, -1);
        const current = snapshot(state);
        return {
            ...prev,
            history: {
                past: newPast,
                future: [current, ...state.history.future].slice(0, 50),
            },
        };
    }),

    redo: () => set((state) => {
        if (state.history.future.length === 0) return state;
        const next = state.history.future[0];
        const newFuture = state.history.future.slice(1);
        const current = snapshot(state);
        return {
            ...next,
            history: {
                past: [...state.history.past, current].slice(-50),
                future: newFuture,
            },
        };
    }),

    // -----------------------------------------------------------------------
    fetchDefaultImages: async () => {
        if (get().defaultImages.length > 0) return;
        const MINIO_BASE = 'http://localhost:9000/assets';
        set({
            defaultImages: [
                `${MINIO_BASE}/default-1.png`,
                `${MINIO_BASE}/default-2.png`,
                `${MINIO_BASE}/default-3.png`,
                `${MINIO_BASE}/default-4.png`,
            ],
        });
    },

    // -----------------------------------------------------------------------
    loadTemplate: async (shopId, token) => {
        set({ isLoading: true });
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const [globalRes, pageRes] = await Promise.all([
                fetch(`http://localhost:3000/api/layouts/${shopId}/draft/global`, { headers }),
                fetch(`http://localhost:3000/api/layouts/${shopId}/draft/page/home`, { headers }),
            ]);

            const globalData = globalRes.ok ? (await globalRes.json()).data : null;
            const pageData = pageRes.ok ? (await pageRes.json()).data : null;

            let shopData: any = null;
            if (!globalData?.theme?.shopName) {
                try {
                    const r = await fetch(`http://localhost:3000/api/shops/${shopId}`, { headers });
                    if (r.ok) shopData = (await r.json()).data;
                } catch { /* ignore */ }
            }

            let availableSchemas: any[] = [];
            try {
                const r = await fetch(`http://localhost:3000/api/layouts/builder/schemas`, { headers });
                if (r.ok) availableSchemas = (await r.json()).data || [];
            } catch { /* ignore */ }

            const shopName = shopData?.name || globalData?.theme?.shopName || 'STOREFRONT';
            const headerDefaults = ComponentSchemas['Header']?.defaultBlocks || [];
            const footerDefaults = ComponentSchemas['Footer']?.defaultBlocks || [];

            const defaultGlobalComponents: UIComponentRef[] = [
                {
                    id: 'global-header',
                    componentId: 'Header',
                    props: { shopName },
                    type: 'section',
                    blocks: headerDefaults.map((b, i) => ({
                        id: uuidv4(), componentId: b.componentId, props: b.props || {}, type: 'block' as const, order: i,
                    })),
                },
                {
                    id: 'global-footer',
                    componentId: 'Footer',
                    props: { shopName },
                    type: 'section',
                    blocks: footerDefaults.map((b, i) => ({
                        id: uuidv4(), componentId: b.componentId, props: b.props || {}, type: 'block' as const, order: i,
                    })),
                },
            ];

            set({
                globalComponents: globalData?.globalComponents?.length ? globalData.globalComponents : defaultGlobalComponents,
                theme: globalData?.theme || (shopData ? { shopName: shopData.name } : {}),
                pages: { home: pageData?.components || [] },
                availableSchemas,
                isLoading: false,
                history: { past: [], future: [] },
            });
        } catch (error) {
            console.error('Failed to load layout', error);
            set({ isLoading: false });
        }
    },

    saveTemplate: async (shopId, token) => {
        const state = get();
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await Promise.all([
                fetch('http://localhost:3000/api/layouts/builder/save/global', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ shopId, theme: state.theme, globalComponents: state.globalComponents }),
                }),
                fetch('http://localhost:3000/api/layouts/builder/save/page', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ shopId, pageType: 'home', components: state.pages['home'] || [] }),
                }),
            ]);
        } catch (error) {
            console.error('Failed to save layout', error);
        }
    },

    publishTemplate: async (shopId, token) => {
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // First save draft, then publish
            await get().saveTemplate(shopId, token);

            await fetch(`http://localhost:3000/api/layouts/${shopId}/publish`, {
                method: 'POST',
                headers,
            });
        } catch (error) {
            console.error('Failed to publish layout', error);
            throw error;
        }
    },
}));
