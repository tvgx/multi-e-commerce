import { create } from 'zustand';

export interface CartItem {
  /** Backend CartItem id — used to PATCH/DELETE a specific line. */
  itemId: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title?: string;
  imageUrl?: string;
}

/** Shape a caller uses to add an item (only variantId + quantity reach the API). */
export interface AddItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  price?: number;
  title?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  isOpen: boolean;
  isLoading: boolean;
  shopSlug: string | null;

  initialize: (shopSlug: string) => Promise<void>;
  refresh: () => Promise<void>;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: AddItemInput) => Promise<void>;
  updateQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

/**
 * All cart calls go through the storefront BFF (`/{shopSlug}/api/store/cart`),
 * which injects the customer Bearer token (from the httpOnly session cookie) or
 * an anonymous guest cart token. That's why the browser store only needs the
 * shopSlug, never the raw token or shopId.
 */
function bffUrl(shopSlug: string, path: string) {
  return `/${shopSlug}/api/store/${path}`;
}

// Backend GET /api/cart → { data: { id, items:[{ id, quantity, variant:{ id, price,
// product:{ id, name, imageUrl } } }], subtotal, itemCount } }
function mapCart(data: any): { items: CartItem[]; totalAmount: number } {
  const items: CartItem[] = (data?.items ?? []).map((it: any) => ({
    itemId: it.id,
    variantId: it.variant?.id ?? it.variantId,
    productId: it.variant?.product?.id ?? '',
    quantity: it.quantity,
    price: it.variant?.price ?? 0,
    title: it.variant?.product?.name,
    imageUrl: it.variant?.product?.imageUrl ?? undefined,
  }));
  return { items, totalAmount: data?.subtotal ?? 0 };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  isOpen: false,
  isLoading: false,
  shopSlug: null,

  initialize: async (shopSlug: string) => {
    set({ shopSlug });
    await get().refresh();
  },

  // internal: re-fetch the authoritative cart from the backend
  refresh: async () => {
    const { shopSlug } = get();
    if (!shopSlug) return;
    try {
      const res = await fetch(bffUrl(shopSlug, 'cart'), { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      set(mapCart(body.data));
    } catch (error) {
      console.error('Failed to fetch cart', error);
    }
  },

  setIsOpen: (isOpen: boolean) => set({ isOpen }),

  addItem: async (item: AddItemInput) => {
    const { shopSlug } = get();
    if (!shopSlug) return;
    set({ isLoading: true });
    try {
      const res = await fetch(bffUrl(shopSlug, 'cart/items'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: item.variantId, quantity: item.quantity }),
      });
      if (res.ok) {
        await get().refresh();
        set({ isOpen: true });
      }
    } catch (error) {
      console.error('Failed to add item', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (_productId: string, variantId: string, quantity: number) => {
    const { shopSlug, items } = get();
    if (!shopSlug) return;
    const target = items.find((i) => i.variantId === variantId);
    if (!target) return;
    set({ isLoading: true });
    try {
      const res = await fetch(bffUrl(shopSlug, `cart/items/${target.itemId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) await get().refresh();
    } catch (error) {
      console.error('Failed to update quantity', error);
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (_productId: string, variantId: string) => {
    const { shopSlug, items } = get();
    if (!shopSlug) return;
    const target = items.find((i) => i.variantId === variantId);
    if (!target) return;
    set({ isLoading: true });
    try {
      const res = await fetch(bffUrl(shopSlug, `cart/items/${target.itemId}`), {
        method: 'DELETE',
      });
      if (res.ok) await get().refresh();
    } catch (error) {
      console.error('Failed to remove item', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    const { shopSlug } = get();
    if (!shopSlug) return;
    set({ isLoading: true });
    try {
      const res = await fetch(bffUrl(shopSlug, 'cart'), { method: 'DELETE' });
      if (res.ok) set({ items: [], totalAmount: 0, isOpen: false });
    } catch (error) {
      console.error('Failed to clear cart', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
