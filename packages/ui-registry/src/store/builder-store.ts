import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, UIComponentRef } from '@ecommerce/schema';

export type DeviceMode = 'desktop' | 'mobile';

interface BuilderStoreState extends BuilderState {
    activeComponentId: string | null;
    activeBlockId: string | null;
    activePage: string;
    deviceMode: DeviceMode;
    isLoading: boolean;
    
    defaultImages: string[];

    // Actions
    setTheme: (themePatch: Record<string, any>) => void;
    updateGlobalComponent: (id: string, props: Record<string, any>) => void;
    addPageSection: (pageType: string, componentId: string, insertIndex?: number) => void;
    removePageSection: (pageType: string, id: string) => void;
    updatePageSection: (pageType: string, id: string, newProps: Record<string, any>) => void;
    reorderPageSections: (pageType: string, startIndex: number, endIndex: number) => void;
    
    // Selection State
    setActiveComponent: (id: string | null) => void;
    setActiveBlock: (id: string | null) => void;
    setActivePage: (page: string) => void;
    setDeviceMode: (mode: DeviceMode) => void;

    // Real-time properties editing
    updateComponentProp: (id: string, propKey: string, value: any) => void;
    updateBlockProp: (blockId: string, propKey: string, value: any) => void;
    
    // Block Management
    addBlock: (parentId: string, blockComponentId: string) => void;
    removeBlock: (blockId: string) => void;
    toggleBlockVisibility: (blockId: string) => void;
    reorderBlocks: (parentId: string, startIndex: number, endIndex: number) => void;

    // Helpers
    fetchDefaultImages: () => Promise<void>;

    // API
    loadTemplate: (shopId: string, token?: string) => Promise<void>;
    saveTemplate: (shopId: string, token?: string) => Promise<void>;
}

// Recursive Helpers
function mapRecursive(components: UIComponentRef[], targetId: string, updater: (c: UIComponentRef) => UIComponentRef): UIComponentRef[] {
    return components.map(c => {
        if (c.id === targetId) {
            return updater(c);
        }
        if (c.blocks && c.blocks.length > 0) {
            return { ...c, blocks: mapRecursive(c.blocks, targetId, updater) };
        }
        return c;
    });
}

function filterRecursive(components: UIComponentRef[], targetId: string): UIComponentRef[] {
    return components.filter(c => c.id !== targetId).map(c => {
        if (c.blocks && c.blocks.length > 0) {
            return { ...c, blocks: filterRecursive(c.blocks, targetId) };
        }
        return c;
    });
}

export const useBuilderStore = create<BuilderStoreState>((set, get) => ({
    globalComponents: [],
    pages: { home: [] },
    theme: {},
    
    activeComponentId: null,
    activeBlockId: null,
    activePage: 'home',
    deviceMode: 'desktop',
    isLoading: false,

    defaultImages: [],

    setTheme: (themePatch) => set((state) => ({
        theme: { ...state.theme, ...themePatch }
    })),

    updateGlobalComponent: (id, props) => set((state) => {
        if (props.shopName !== undefined) {
            return {
                theme: { ...state.theme, shopName: props.shopName },
                globalComponents: state.globalComponents.map((c) =>
                    (c.componentId === 'Header' || c.componentId === 'Footer') 
                        ? { ...c, props: { ...c.props, ...props, shopName: props.shopName } } 
                        : (c.id === id ? { ...c, props: { ...c.props, ...props } } : c)
                )
            };
        }
        return {
            globalComponents: state.globalComponents.map((c) =>
                c.id === id ? { ...c, props: { ...c.props, ...props } } : c
            )
        };
    }),

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

        const newNode: UIComponentRef = { id: uuidv4(), componentId, props, order: 0, type: 'section' };
        
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

        return { pages, activeComponentId: newNode.id, activeBlockId: null };
    }),

    removePageSection: (pageType, id) => set((state) => {
        const pages = { ...state.pages };
        if (!pages[pageType]) return state;

        pages[pageType] = pages[pageType].filter((c) => c.id !== id);
        
        return { 
            pages, 
            activeComponentId: state.activeComponentId === id ? null : state.activeComponentId,
            activeBlockId: state.activeComponentId === id ? null : state.activeBlockId
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

    setActiveComponent: (id) => set({ activeComponentId: id, activeBlockId: null }),
    setActiveBlock: (id) => set({ activeBlockId: id }),
    setActivePage: (page) => set({ activePage: page }),
    setDeviceMode: (mode) => set({ deviceMode: mode }),

    updateComponentProp: (id, propKey, value) => set((state) => {
        // Find in global components
        let isGlobal = state.globalComponents.some(c => c.id === id);
        if (isGlobal) {
            return {
                globalComponents: state.globalComponents.map(c => 
                    c.id === id ? { ...c, props: { ...c.props, [propKey]: value } } : c
                )
            };
        }

        // Find in pages
        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];
        pages[state.activePage] = activePageList.map(c => 
            c.id === id ? { ...c, props: { ...c.props, [propKey]: value } } : c
        );

        return { pages };
    }),

    updateBlockProp: (blockId, propKey, value) => set((state) => {
        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];
        
        return {
            globalComponents: mapRecursive(state.globalComponents, blockId, (c) => ({
                ...c,
                props: { ...c.props, [propKey]: value }
            })),
            pages: {
                ...pages,
                [state.activePage]: mapRecursive(activePageList, blockId, (c) => ({
                    ...c,
                    props: { ...c.props, [propKey]: value }
                }))
            }
        };
    }),

    addBlock: (parentId, blockComponentId) => set((state) => {
        const newBlock: UIComponentRef = {
            id: uuidv4(),
            componentId: blockComponentId,
            type: 'block',
            props: {},
            order: 0
        };

        const updater = (c: UIComponentRef) => {
            const currentBlocks = c.blocks || [];
            newBlock.order = currentBlocks.length;
            return { ...c, blocks: [...currentBlocks, newBlock] };
        };

        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];

        return {
            globalComponents: mapRecursive(state.globalComponents, parentId, updater),
            pages: {
                ...pages,
                [state.activePage]: mapRecursive(activePageList, parentId, updater)
            },
            activeBlockId: newBlock.id
        };
    }),

    removeBlock: (blockId) => set((state) => {
        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];

        return {
            globalComponents: filterRecursive(state.globalComponents, blockId),
            pages: {
                ...pages,
                [state.activePage]: filterRecursive(activePageList, blockId)
            },
            activeBlockId: state.activeBlockId === blockId ? null : state.activeBlockId
        };
    }),

    toggleBlockVisibility: (blockId) => set((state) => {
        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];
        
        const updater = (c: UIComponentRef) => ({ ...c, isHidden: !c.isHidden });

        return {
            globalComponents: mapRecursive(state.globalComponents, blockId, updater),
            pages: {
                ...pages,
                [state.activePage]: mapRecursive(activePageList, blockId, updater)
            }
        };
    }),

    reorderBlocks: (parentId, startIndex, endIndex) => set((state) => {
        const updater = (c: UIComponentRef) => {
            if (!c.blocks) return c;
            const newBlocks = Array.from(c.blocks);
            const [removed] = newBlocks.splice(startIndex, 1);
            newBlocks.splice(endIndex, 0, removed);
            newBlocks.forEach((b, index) => b.order = index);
            return { ...c, blocks: newBlocks };
        };

        const pages = { ...state.pages };
        const activePageList = pages[state.activePage] || [];

        return {
            globalComponents: mapRecursive(state.globalComponents, parentId, updater),
            pages: {
                ...pages,
                [state.activePage]: mapRecursive(activePageList, parentId, updater)
            }
        };
    }),

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
            const globalRes = await fetch(`http://localhost:3000/api/layouts/${shopId}/global`, { headers });
            let globalData: any = null;
            if (globalRes.ok) {
                const json = await globalRes.json();
                globalData = json.data;
            }

            // Fetch Page Layout (home)
            const pageRes = await fetch(`http://localhost:3000/api/layouts/${shopId}/page/home`, { headers });
            let pageData: any = null;
            if (pageRes.ok) {
                const json = await pageRes.json();
                pageData = json.data;
            }

            let shopData: any = null;
            if (!globalData?.theme?.shopName) {
                try {
                    const shopRes = await fetch(`http://localhost:3000/api/shops/${shopId}`, { headers });
                    if (shopRes.ok) {
                        const shopJson = await shopRes.json();
                        shopData = shopJson.data;
                    }
                } catch (err) {}
            }

            const defaultGlobalComponents: UIComponentRef[] = [
                { 
                    id: 'global-header', 
                    componentId: 'Header', 
                    props: { shopName: shopData?.name || 'STOREFRONT' }, 
                    type: 'section',
                    blocks: [
                        { id: uuidv4(), componentId: 'HeaderMenuItem', props: { label: 'All Products', link: '/all-products' }, type: 'block' },
                        { id: uuidv4(), componentId: 'HeaderLanguageSwitcher', props: {}, type: 'block' },
                        { id: uuidv4(), componentId: 'HeaderCartTrigger', props: {}, type: 'block' }
                    ]
                },
                { 
                    id: 'global-footer', 
                    componentId: 'Footer', 
                    props: { shopName: shopData?.name || 'STOREFRONT' }, 
                    type: 'section' 
                }
            ];

            const finalTheme = globalData?.theme || (shopData ? { shopName: shopData.name } : {});

            set({
                globalComponents: globalData?.globalComponents?.length ? globalData.globalComponents : defaultGlobalComponents,
                theme: finalTheme,
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
            await fetch(`http://localhost:3000/api/layouts/publish/global`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    shopId,
                    theme: state.theme,
                    globalComponents: state.globalComponents
                })
            });

            // Save Page Layout (home)
            await fetch(`http://localhost:3000/api/layouts/publish/page`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    shopId,
                    pageType: 'home',
                    components: state.pages['home'] || []
                })
            });

        } catch (error) {
            console.error("Failed to save layout", error);
        }
    }
}));
