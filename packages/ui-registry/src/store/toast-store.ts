import { create } from 'zustand';

/**
 * App-wide toast + confirm primitive, replacing native alert()/confirm().
 *
 * Use the imperative helpers anywhere (event handlers, hooks, catch blocks):
 *   toast.success('Đã lưu');
 *   toast.error(err.message);
 *   if (!(await confirmDialog({ message: 'Xoá mục này?', danger: true }))) return;
 *
 * A single <Toaster /> must be mounted once per app (in the root layout).
 */
export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ConfirmRequest {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface ToastStore {
  toasts: ToastItem[];
  confirmReq: ConfirmRequest | null;
  push: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
  requestConfirm: (req: Omit<ConfirmRequest, 'id' | 'resolve'>) => Promise<boolean>;
  resolveConfirm: (ok: boolean) => void;
}

const newId = () => Math.random().toString(36).slice(2);

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  confirmReq: null,
  push: (type, message) => {
    const id = newId();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().dismiss(id), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  requestConfirm: (req) =>
    new Promise<boolean>((resolve) => {
      set({ confirmReq: { ...req, id: newId(), resolve } });
    }),
  resolveConfirm: (ok) => {
    const req = get().confirmReq;
    if (req) req.resolve(ok);
    set({ confirmReq: null });
  },
}));

/** Fire-and-forget toasts, callable outside React. */
export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
};

/** Promise-based confirm. Resolves true if the user confirms, false otherwise. */
export function confirmDialog(req: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  return useToastStore.getState().requestConfirm(req);
}
