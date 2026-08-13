import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartLineKey } from '@/lib/product-pricing';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  /** Seçilen ölçü etiketi, ör. "200x30 cm". */
  size?: string;
  /** Seçilen ölçü varyantının kimliği — fiyat sunucuda bununla doğrulanır. */
  variantId?: string;
}

/**
 * Sepet satırı kimliği ürün + varyant/ölçü + renk kombinasyonudur.
 * Aynı ürünün 180x30 ve 200x30 ölçüleri AYRI kalemlerdir.
 */
const keyOf = (i: { id: string; variantId?: string; size?: string; color?: string }) =>
  cartLineKey({ id: i.id, variantId: i.variantId, size: i.size, color: i.color });

interface CartState {
  isOpen: boolean;
  items: CartItem[];
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, color?: string, size?: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, color?: string, size?: string, variantId?: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      isOpen: false,
      items: [],
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (newItem) => set((state) => {
        const key = keyOf(newItem);
        const existingItem = state.items.find(item => keyOf(item) === key);

        if (existingItem) {
          return {
            items: state.items.map(item =>
              keyOf(item) === key
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
            isOpen: true
          };
        }

        return { items: [...state.items, newItem], isOpen: true };
      }),
      removeItem: (id, color, size, variantId) => set((state) => {
        const key = cartLineKey({ id, variantId, size, color });
        return { items: state.items.filter(item => keyOf(item) !== key) };
      }),
      // Yalnız hedeflenen varyant satırını günceller.
      // Eskiden sadece `id` ile eşleşiyordu ve aynı ürünün TÜM ölçülerini
      // birden değiştiriyordu.
      updateQuantity: (id, quantity, color, size, variantId) => set((state) => {
        const key = cartLineKey({ id, variantId, size, color });
        return {
          items: state.items.map(item =>
            keyOf(item) === key ? { ...item, quantity: Math.max(1, quantity) } : item
          )
        };
      }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'decoroys-cart-storage',
      // Sadece items array'ini locale kaydet, isOpen (çekmece açık mı?) state'ini saklamaya gerek yok
      partialize: (state) => ({ items: state.items }),
    }
  )
);
