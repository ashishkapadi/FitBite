import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch, safeJson } from '../config/api';
import { FALLBACK_MEALS, FALLBACK_SELLERS } from '../utils/demoCatalogFallback';

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
  const [removingIds, setRemovingIds] = useState(new Set());
  const [removalError, setRemovalError] = useState(null);

  // Helper to commit cart data locally
  const saveCartLocally = (newItems, newSeller) => {
    const safeItems = Array.isArray(newItems) ? newItems : [];
    const sub = safeItems.reduce((acc, i) => acc + (i.total_price || (i.unit_base_price * i.quantity) || 0), 0);
    const count = safeItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
    const activeSeller = newSeller || seller || FALLBACK_SELLERS[0];
    const cartObj = {
      id: 'cart_active',
      seller: activeSeller,
      items: safeItems,
      subtotal: sub,
      item_count: count
    };

    setCart(cartObj);
    setItems(safeItems);
    setSeller(activeSeller);
    setSubtotal(sub);
    setItemCount(count);

    try {
      localStorage.setItem('fitbite_cart_data', JSON.stringify(cartObj));
    } catch (e) {
      console.warn('Could not save cart locally:', e);
    }
    return cartObj;
  };

  // Restore cart on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fitbite_cart_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          setCart(parsed);
          setItems(parsed.items);
          setSeller(parsed.seller || FALLBACK_SELLERS[0]);
          setSubtotal(parsed.subtotal || 0);
          setItemCount(parsed.item_count || 0);
        }
      } else {
        // Initialize default demo cart item so explore & checkout are immediately interactive
        const defaultItem = {
          id: 'cart_item_init_01',
          meal_id: FALLBACK_MEALS[0].id,
          meal_name_snapshot: FALLBACK_MEALS[0].name,
          meal_image_snapshot: FALLBACK_MEALS[0].image_url,
          unit_base_price: FALLBACK_MEALS[0].base_price,
          quantity: 1,
          portion_snapshot: 'standard',
          customizations_snapshot: {},
          total_price: FALLBACK_MEALS[0].base_price,
          seller_id: FALLBACK_MEALS[0].seller_id
        };
        saveCartLocally([defaultItem], FALLBACK_SELLERS[0]);
      }
    } catch (err) {
      console.warn('Error restoring cart state:', err);
    }

    if (user && user.role === 'customer') {
      fetchRemoteCart();
    }
  }, [user]);

  const fetchRemoteCart = async () => {
    try {
      const token = localStorage.getItem('fitbite_token');
      if (!token) return;

      const res = await apiFetch('/api/cart', { timeout: 3000 });
      if (res.ok) {
        const data = await safeJson(res);
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          saveCartLocally(data.items, data.seller || seller);
        }
      }
    } catch (err) {
      // Retain local cart if remote is unreachable
      console.warn('[CartContext] Background cart sync note:', err.message);
    }
  };

  const addToCart = async (target, qtyParam = 1, portionParam = 'standard', customizationsParam = {}, specialNotesParam = '', replace_cart_if_conflict = false) => {
    let meal_id = '';
    let quantity = 1;
    let portion = 'standard';
    let customizations = {};
    let special_notes = '';
    let replaceCart = false;
    let mealName = '';
    let mealPrice = 180;
    let mealImage = '';
    let sellerId = 'seller_01';
    let sellerName = 'Annapurna Homestyle Tiffin Ghar';

    if (typeof target === 'string') {
      meal_id = target;
      quantity = Number(qtyParam) || 1;
      portion = portionParam || 'standard';
      customizations = customizationsParam || {};
      special_notes = specialNotesParam || '';
    } else if (typeof target === 'object' && target !== null) {
      meal_id = target.meal_id || target.id || target.mealId;
      quantity = Number(target.quantity || qtyParam || 1);
      portion = target.portion || portionParam || 'standard';
      customizations = target.customizations || customizationsParam || {};
      special_notes = target.special_notes || specialNotesParam || '';
      replaceCart = Boolean(target.replace_cart_if_conflict || replace_cart_if_conflict);
      mealName = target.name || target.meal_name_snapshot || '';
      mealPrice = Number(target.base_price || target.calculated_price || target.price || target.unit_base_price || 180);
      mealImage = target.image_url || target.meal_image_snapshot || '';
      sellerId = target.seller_id || target.seller?.id || 'seller_01';
      sellerName = target.seller_name || target.seller?.business_name || 'Annapurna Homestyle Tiffin Ghar';
    }

    if (!meal_id) {
      meal_id = FALLBACK_MEALS[0].id;
    }

    const foundFallback = FALLBACK_MEALS.find(m => m.id === meal_id);
    if (foundFallback) {
      if (!mealName) mealName = foundFallback.name;
      if (!mealPrice) mealPrice = Number(foundFallback.base_price);
      if (!mealImage) mealImage = foundFallback.image_url;
      if (!sellerId) sellerId = foundFallback.seller_id;
    }

    // 1. Instant Local State Update (Zero UI latency for guests and users alike)
    let nextItems = replaceCart ? [] : [...items];
    const existingIndex = nextItems.findIndex(i => (i.meal_id === meal_id || i.id === meal_id));

    if (existingIndex >= 0) {
      const existing = nextItems[existingIndex];
      const newQty = existing.quantity + quantity;
      const unitPrice = existing.unit_base_price || mealPrice;
      nextItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        total_price: newQty * unitPrice
      };
    } else {
      nextItems.push({
        id: 'cart_item_' + Date.now(),
        meal_id,
        meal_name_snapshot: mealName || 'Delicious Tiffin Meal',
        meal_image_snapshot: mealImage || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
        unit_base_price: mealPrice,
        quantity,
        portion_snapshot: portion,
        customizations_snapshot: customizations,
        special_notes_snapshot: special_notes,
        total_price: mealPrice * quantity,
        seller_id: sellerId
      });
    }

    saveCartLocally(nextItems, { id: sellerId, business_name: sellerName });

    // 2. Non-blocking remote sync if customer is authenticated
    if (user) {
      try {
        setLoading(true);
        const res = await apiFetch('/api/cart/add', {
          method: 'POST',
          timeout: 4000,
          body: JSON.stringify({
            meal_id,
            quantity,
            portion,
            customizations,
            special_notes,
            replace_cart_if_conflict: replaceCart
          })
        });

        if (res.status === 409) {
          const data = await safeJson(res);
          if (data.conflict) {
            setConflictModalData({
              current_seller: data.current_seller,
              new_seller: data.new_seller,
              message: data.message,
              pendingPayload: { meal_id, quantity, portion, customizations, special_notes }
            });
            return { conflict: true };
          }
        }
      } catch (err) {
        // Silently retain local state if backend is offline
        console.warn('[CartContext] Remote sync note:', err.message);
      } finally {
        setLoading(false);
      }
    }

    return { success: true };
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
    let nextItems;
    if (quantity <= 0) {
      nextItems = items.filter(i => i.id !== itemId && i.meal_id !== itemId);
    } else {
      nextItems = items.map(i => {
        if (i.id === itemId || i.meal_id === itemId) {
          const unitPrice = i.unit_base_price || 180;
          return {
            ...i,
            quantity,
            total_price: unitPrice * quantity
          };
        }
        return i;
      });
    }

    saveCartLocally(nextItems, seller);

    if (user) {
      try {
        await apiFetch(`/api/cart/items/${itemId}`, {
          method: 'PUT',
          timeout: 3000,
          body: JSON.stringify({ quantity })
        });
      } catch (err) {
        console.warn('[CartContext] Background updateQuantity note:', err.message);
      }
    }
  };

  const removeFromCart = async (target) => {
    const itemId = typeof target === 'object' && target !== null ? (target.id || target.meal_id) : target;
    if (!itemId) return { error: 'Invalid cart item identifier.' };

    if (removingIds.has(itemId)) return;
    setRemovingIds(prev => new Set([...prev, itemId]));
    setRemovalError(null);

    const nextItems = items.filter(i => i.id !== itemId && i.meal_id !== itemId);
    saveCartLocally(nextItems, seller);

    if (user) {
      try {
        await apiFetch(`/api/cart/items/${itemId}`, {
          method: 'DELETE',
          timeout: 3000
        });
      } catch (err) {
        console.warn('[CartContext] Background removeFromCart note:', err.message);
      } finally {
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    } else {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }

    return { success: true };
  };

  const clearCart = async () => {
    saveCartLocally([], null);
    if (user) {
      try {
        await apiFetch('/api/cart/clear', {
          method: 'DELETE',
          timeout: 2000
        });
      } catch (err) {
        console.warn('[CartContext] Background clearCart note:', err.message);
      }
    }
  };

  const isItemRemoving = (id) => removingIds.has(id);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        seller,
        subtotal,
        itemCount,
        loading,
        removingIds,
        isItemRemoving,
        removalError,
        conflictModalData,
        confirmReplaceCart,
        cancelConflict,
        fetchCart: fetchRemoteCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        removeItem: removeFromCart,
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
