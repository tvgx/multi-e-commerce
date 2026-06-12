import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, UIComponentRef } from '@ecommerce/schema';
import { ComponentSchemas } from '../component-schemas';

export type DeviceMode = 'desktop' | 'mobile';

// Pages a shop owner can customise in the builder. Order here drives the page
// switcher. Labels are intentionally plain-language for non-technical owners.
export const EDITABLE_PAGES: { key: string; label: string; description: string }[] = [
    { key: 'home', label: 'Trang chủ', description: 'Trang đầu tiên khách nhìn thấy' },
    { key: 'product_listing', label: 'Trang danh sách sản phẩm', description: 'Nơi khách duyệt và lọc sản phẩm' },
    { key: 'product_detail', label: 'Trang chi tiết sản phẩm', description: 'Thông tin chi tiết của một sản phẩm' },
];

export const EDITABLE_PAGE_KEYS = EDITABLE_PAGES.map(p => p.key);

// Starter sections used when a page has never been saved, so the canvas is
// never blank. Mirrors the server-side seed in api-core's LayoutService.
function defaultSectionsForPage(pageType: string): UIComponentRef[] {
    const section = (componentId: string, props: Record<string, any>, order: number): UIComponentRef => ({
        id: uuidv4(), componentId, type: 'section', props, order,
    });
    switch (pageType) {
        case 'home':
            return [
                section('Hero', {
                    title: 'Chào mừng đến với cửa hàng',
                    subtitle: 'Khám phá những sản phẩm mới nhất của chúng tôi',
                    ctaText: 'Mua ngay',
                    ctaLink: '/all-products',
                }, 0),
                section('FeaturedProducts', { title: 'Sản phẩm nổi bật' }, 1),
            ];
        case 'product_listing':
            return [section('StandardCategoryPage', {
                title: 'Tất cả sản phẩm',
                description: 'Khám phá toàn bộ bộ sưu tập của chúng tôi.',
            }, 0)];
        case 'product_detail':
            return [section('StandardProductDetail', {}, 0)];
        default:
            return [];
    }
}

interface HistorySnapshot {
    globalComponents: UIComponentRef[];
    pages: Record<string, UIComponentRef[]>;
    theme: Record<string, any>;
}

interface BuilderStoreState extends BuilderState {
    shopId: string | null;
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
// All store updates are immutable (objects are replaced, never mutated), so
// snapshots can hold references — no deep clone needed. Cloning the entire
// layout per keystroke was the builder's main performance bottleneck.
function snapshot(state: BuilderStoreState): HistorySnapshot {
    return {
        globalComponents: state.globalComponents,
        pages: state.pages,
        theme: state.theme,
    };
}

// Rapid edits to the same target (typing in a text field, dragging a color
// picker) are coalesced into a single history entry, so undo reverts the
// whole burst instead of one character at a time.
const COALESCE_WINDOW_MS = 800;
let lastPushAt = 0;
let lastPushKey = '';

function resetHistoryBurst() {
    lastPushAt = 0;
    lastPushKey = '';
}

function pushHistory(state: BuilderStoreState, coalesceKey?: string): Pick<BuilderStoreState, 'history'> {
    const now = Date.now();
    if (
        coalesceKey &&
        coalesceKey === lastPushKey &&
        now - lastPushAt < COALESCE_WINDOW_MS &&
        state.history.past.length > 0
    ) {
        lastPushAt = now; // extend the burst while edits keep coming
        return { history: { past: state.history.past, future: [] } };
    }
    lastPushAt = now;
    lastPushKey = coalesceKey ?? '';
    return {
        history: {
            past: [...state.history.past.slice(-49), snapshot(state)],
            future: [],
        },
    };
}


// -----------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------
export const useBuilderStore = create<BuilderStoreState>((set, get) => ({
    globalComponents: [],
    pages: { home: [], product_listing: [], product_detail: [] },
    theme: {},

    shopId: null,
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
        ...pushHistory(state, `theme:${Object.keys(themePatch).join(',')}`),
        theme: { ...state.theme, ...themePatch },
    })),

    updateGlobalComponent: (id, props) => set((state) => {
        const hist = pushHistory(state, `global:${id}:${Object.keys(props).join(',')}`);
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

        const imgs = state.defaultImages;
        let props: any = {};
        if (imgs.length > 0) {
            props.backgroundImageUrl = imgs[Math.floor(Math.random() * imgs.length)];
        }

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
            // Copy instead of mutating: history snapshots share references
            pages[pageType] = newArray.map((c, i) => (c.order === i ? c : { ...c, order: i }));
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
        const hist = pushHistory(state, `section:${id}:${Object.keys(newProps).join(',')}`);
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
        pages[pageType] = arr.map((c, i) => (c.order === i ? c : { ...c, order: i }));
        return { ...hist, pages };
    }),

    setActiveComponent: (id) => set({ activeComponentId: id, activeBlockId: null }),
    setActiveBlock: (id) => set({ activeBlockId: id }),
    setActivePage: (page) => set({ activePage: page }),
    setDeviceMode: (mode) => set({ deviceMode: mode }),

    updateComponentProp: (id, propKey, value) => set((state) => {
        const hist = pushHistory(state, `prop:${id}:${propKey}`);
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
        const hist = pushHistory(state, `block:${blockId}:${propKey}`);
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
            return { ...c, blocks: arr.map((b, i) => (b.order === i ? b : { ...b, order: i })) };
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
        resetHistoryBurst();
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
        resetHistoryBurst();
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
        // defaultImages will be populated from the shop's actual media library
        // when the builder loads a saved template via loadTemplate
    },

    // -----------------------------------------------------------------------
    loadTemplate: async (shopId, token) => {
        set({ isLoading: true, shopId });
        try {
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const [globalRes, ...pageResults] = await Promise.all([
                fetch(`http://localhost:3000/api/layouts/${shopId}/draft/global`, { headers }),
                ...EDITABLE_PAGE_KEYS.map(pageType =>
                    fetch(`http://localhost:3000/api/layouts/${shopId}/draft/page/${pageType}`, { headers })
                ),
            ]);

            const globalData = globalRes.ok ? (await globalRes.json()).data : null;

            // Build the pages map for every editable page. A page that was never
            // saved (null) gets sensible starter sections; an explicitly-emptied
            // page (components: []) is respected as-is.
            const pages: Record<string, UIComponentRef[]> = {};
            await Promise.all(EDITABLE_PAGE_KEYS.map(async (pageType, i) => {
                const res = pageResults[i];
                const data = res.ok ? (await res.json()).data : null;
                pages[pageType] = data?.components
                    ? data.components
                    : defaultSectionsForPage(pageType);
            }));

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
                pages,
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
                ...EDITABLE_PAGE_KEYS.map(pageType =>
                    fetch('http://localhost:3000/api/layouts/builder/save/page', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ shopId, pageType, components: state.pages[pageType] || [] }),
                    })
                ),
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
