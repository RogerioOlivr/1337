import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  produtoId: number
  nome: string
  preco: number
  imagem: string | null
  quantidade: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  addItem: (item: Omit<CartItem, 'quantidade'>) => void
  removeItem: (produtoId: number) => void
  updateQty: (produtoId: number, delta: number) => void
  clearCart: () => void

  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  isOpen: false,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.produtoId === item.produtoId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.produtoId === item.produtoId
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...item, quantidade: 1 }] }
    }),

  removeItem: (produtoId) =>
    set((state) => ({
      items: state.items.filter((i) => i.produtoId !== produtoId),
    })),

  updateQty: (produtoId, delta) =>
    set((state) => {
      const updated = state.items
        .map((i) =>
          i.produtoId === produtoId
            ? { ...i, quantidade: i.quantidade + delta }
            : i
        )
        .filter((i) => i.quantidade > 0)
      return { items: updated }
    }),

  clearCart: () => set({ items: [] }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  total: () =>
    get().items.reduce((acc, i) => acc + i.preco * i.quantidade, 0),

  count: () => get().items.reduce((acc, i) => acc + i.quantidade, 0),
    }),
    {
      name: '1337-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
