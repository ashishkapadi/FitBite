import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, openAuthModal } = useAuth();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [seller, setSeller] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conflictModalData, setConflictModalData] = useState(null);

  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchCart();
    } else {
      setCart(null);
      setItems([]);
      setSeller(null);
      setSubtotal(0);
      setItemCount(0);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('fitbite_token');
      if (!token) return;

      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
        setItems(data.items || []);
        setSeller(data.seller || null);
        setSubtotal(data.subtotal || 0);
        setItemCount(data.item_count || 0);
      }
    } catch (err) {
      console.error('[CartContext] fetchCart error:', err);
    }
  };

  const addToCart = async ({
    meal_id,
    quantity = 1,
    portion = 'standard',
    customizations = {},
    special_notes = '',
    replace_cart_if_conflict = false
  }) => {
    if (!user) {
      openAuthModal({
        mode: 'signin',
        accountType: 'customer',
        action: () => addToCart({ meal_id, quantity, portion, customizations, special_notes })
      });
      return { requiresAuth: true };
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('fitbite_token');
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          meal_id,
          quantity,
          portion,
          customizations,
          special_notes,
          replace_cart_if_conflict
        })
      });

      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        // Kitchen conflict: Cart contains items from another kitchen
        setConflictModalData({
          current_seller: data.current_seller,
          new_seller: data.new_seller,
          message: data.message,
          pendingPayload: { meal_id, quantity, portion, customizations, special_notes }
        });
        return { conflict: true };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add item to cart.');
      }

      await fetchCart();
      return { success: true };
    } catch (err) {
      console.error('[CartContext] addToCart error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmReplaceCart = async () => {
    if (!conflictModalData?.pendingPayload) return;
    const payload = conflictModalData.pendingPayload;
    setConflictModalData(null);
    await addToCart({ ...payload, replace_cart_if_conflict: true });
  };

  const cancelConflict = () => {
    setConflictModalData(null);
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const token = localStorage.getItem('fitbite_token');
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });
      await fetchCart();
    } catch (err) {
      console.error('[CartContext] updateQuantity error:', err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('fitbite_token');
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (err) {
      console.error('[CartContext] removeItem error:', err);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('fitbite_token');
      await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
    } catch (err) {
      console.error('[CartContext] clearCart error:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        seller,
        subtotal,
        itemCount,
        loading,
        conflictModalData,
        confirmReplaceCart,
        cancelConflict,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
