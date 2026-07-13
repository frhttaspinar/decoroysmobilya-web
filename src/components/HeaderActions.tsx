"use client";

import { useCartStore } from "@/store/useCartStore";
import { useDrawerStore } from "@/store/useDrawerStore";
import { ShoppingBag, User } from "lucide-react";
import { motion } from "motion/react";

const EASE = [0.22, 0.6, 0.22, 1] as const;

export default function HeaderActions() {
  const { items } = useCartStore();
  const { openDrawer } = useDrawerStore();

  return (
    <div className="flex items-center gap-4 md:gap-8">
      <motion.div
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.44, ease: EASE }}
        whileHover={{ y: -3, scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        <button
          onClick={() => openDrawer("profile")}
          className="group flex items-center gap-2 hover:text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-lg p-1"
        >
          <User className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5px]" />
          <span className="hidden sm:inline tracking-wide">Profil</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.52, ease: EASE }}
        whileHover={{ y: -3, scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        <button
          onClick={() => openDrawer("cart")}
          className="group flex items-center gap-2 hover:text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-lg p-1"
        >
          <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5px]" />
          <span className="hidden sm:inline tracking-wide">Sepet</span>
          {items.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="bg-zinc-900 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm"
            >
              {items.length}
            </motion.span>
          )}
        </button>
      </motion.div>
    </div>
  );
}
