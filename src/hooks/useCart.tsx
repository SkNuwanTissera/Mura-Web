import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCartItems } from '../api';
import { useAuth } from './useAuth';

interface CartContextValue {
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (user?.role !== 'PARENT' || !user.parentId) {
      setCartCount(0);
      return;
    }

    try {
      const items = await fetchCartItems(user.parentId);
      setCartCount(items.length);
    } catch {
      setCartCount(0);
    }
  }, [user?.parentId, user?.role]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const value = useMemo(
    () => ({
      cartCount,
      refreshCart,
    }),
    [cartCount, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
