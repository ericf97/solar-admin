import { create } from "zustand";

interface CrudState<T> {
  items: T[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

interface CrudActions<T> {
  setItems: (items: T[], totalCount: number) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, item: Partial<T>) => void;
  removeItem: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type CrudStore<T> = CrudState<T> & CrudActions<T>;

export function createCrudStore<T extends { id: string }>() {
  return create<CrudStore<T>>(set => ({
    items: [],
    totalCount: 0,
    isLoading: false,
    error: null,

    setItems: (items, totalCount) =>
      set({ items, totalCount, isLoading: false }),

    addItem: item =>
      set(state => ({
        items: [item, ...state.items],
        totalCount: state.totalCount + 1,
      })),

    updateItem: (id, updatedItem) =>
      set(state => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, ...updatedItem } : item
        ),
      })),

    removeItem: id =>
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        totalCount: state.totalCount - 1,
      })),

    setLoading: isLoading => set({ isLoading }),

    setError: error => set({ error, isLoading: false }),

    reset: () =>
      set({ items: [], totalCount: 0, isLoading: false, error: null }),
  }));
}

