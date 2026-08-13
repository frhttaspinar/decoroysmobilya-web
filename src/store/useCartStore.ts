import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartLineKey } from '@/lib/product-pricing';

/**
 * Sepet kalemi — ürün dokümanının o andaki anlık görüntüsü.
 * 1 ÜRÜN = 1 FİYAT + 1 ÖLÇÜ + 1 RENK olduğu için müşterinin seçtiği
 * bir varyant yoktur; ölçü ve renk doğrudan üründen taşınır.
 *
 * Not: buradaki fiyat yalnız GÖSTERİM içindir. Ödeme fiyatı sunucuda
 * Firestore ürün dokümanından yeniden okunur (bkz. /api/payment/paytr).
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  /** Ürünün rengi (product.color). */
  color?: string;
  /** Ürünün ölçüsü (product.size), ör. "200x30 cm". */
  size?: string;
  stockCode?: string;
}

/** Sepet satırı kimliği: ürün + ölçü + renk. */
const keyOf = (i: { id: string; size?: string; color?: string }) =>
  cartLineKey({ id: i.id, size: i.size, color: i.color });

interface CartState {
  isOpen: boolean;
  items: CartItem[];
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, color?: string, size?: string) => void;
  updateQuantity: (id: string, quantity: number, color?: string, size?: string) => void;
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
      removeItem: (id, color, size) => set((state) => {
        const key = cartLineKey({ id, size, color });
        return { items: state.items.filter(item => keyOf(item) !== key) };
      }),
      // Yalnız hedeflenen satırı günceller.
      updateQuantity: (id, quantity, color, size) => set((state) => {
        const key = cartLineKey({ id, size, color });
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
