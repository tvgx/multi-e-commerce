import { create } from 'zustand';

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  isOpen: boolean;
  isLoading: boolean;
  sessionId: string;
  shopId: string | null;
  
  initialize: (shopId: string) => Promise<void>;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// We use local storage to persist the session ID for guests
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    // If auth token exists, backend will prefer it over this generated ID
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

const getHeaders = (sessionId: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
  };
  // Add auth token if integrated with your auth system
  return headers;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  isOpen: false,
  isLoading: false,
  sessionId: '',
  shopId: null,

  initialize: async (shopId: string) => {
    if (get().isLoading) return;
    const sessionId = getSessionId();
    set({ isLoading: true, sessionId, shopId });
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${shopId}`, {
        headers: getHeaders(sessionId),
      });
      const data = await res.json();
      if (data.code === '1000') {
        set({ items: data.data.items, totalAmount: data.data.totalAmount });
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setIsOpen: (isOpen: boolean) => set({ isOpen }),

  addItem: async (item: CartItem) => {
    const { shopId, sessionId } = get();
    if (!shopId) return;
    set({ isLoading: true });
    
    // Optimistic UI update could go here
    
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${shopId}/items`, {
        method: 'POST',
        headers: getHeaders(sessionId),
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.code === '1000') {
        set({ items: data.data.items, totalAmount: data.data.totalAmount, isOpen: true });
      }
    } catch (error) {
      console.error('Failed to add item', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId: string, variantId: string, quantity: number) => {
    const { shopId, sessionId } = get();
    if (!shopId) return;
    set({ isLoading: true });
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${shopId}/items/${productId}/${variantId}`, {
        method: 'PUT',
        headers: getHeaders(sessionId),
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.code === '1000') {
        set({ items: data.data.items, totalAmount: data.data.totalAmount });
      }
    } catch (error) {
      console.error('Failed to update quantity', error);
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string, variantId: string) => {
    const { shopId, sessionId } = get();
    if (!shopId) return;
    set({ isLoading: true });
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${shopId}/items/${productId}/${variantId}`, {
        method: 'DELETE',
        headers: getHeaders(sessionId),
      });
      const data = await res.json();
      if (data.code === '1000') {
        set({ items: data.data.items, totalAmount: data.data.totalAmount });
      }
    } catch (error) {
      console.error('Failed to remove item', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    const { shopId, sessionId } = get();
    if (!shopId) return;
    set({ isLoading: true });
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${shopId}/clear`, {
        method: 'DELETE',
        headers: getHeaders(sessionId),
      });
      const data = await res.json();
      if (data.code === '1000') {
        set({ items: [], totalAmount: 0, isOpen: false });
      }
    } catch (error) {
      console.error('Failed to clear cart', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
