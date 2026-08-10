import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      loadLocalCart();
    }
  }, [user]);

  const loadLocalCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('karviyam_mobile_cart');
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[CartContext] Load local error', e);
    }
  };

  const saveLocalCart = async (newCart) => {
    setCart(newCart);
    await AsyncStorage.setItem('karviyam_mobile_cart', JSON.stringify(newCart));
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (e) {
      console.error('[CartContext] Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, size = 'M', quantity = 1) => {
    if (user) {
      try {
        await api.post('/cart/items', { productId: product.id, quantity, selectedSize: size });
        await fetchCart();
      } catch (e) {
        console.error('[CartContext] Add API error', e);
      }
    } else {
      const existingIdx = cart.items.findIndex(
        (i) => i.product?.id === product.id && i.selectedSize === size
      );
      let newItems = [...cart.items];
      if (existingIdx > -1) {
        newItems[existingIdx].quantity += quantity;
      } else {
        newItems.push({
          id: Date.now(),
          product,
          selectedSize: size,
          quantity,
        });
      }
      await saveLocalCart({ items: newItems });
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) return removeItem(itemId);
    if (user) {
      try {
        await api.put(`/cart/items/${itemId}`, { quantity });
        await fetchCart();
      } catch (e) {
        console.error('[CartContext] Update API error', e);
      }
    } else {
      const newItems = cart.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      );
      await saveLocalCart({ items: newItems });
    }
  };

  const removeItem = async (itemId) => {
    if (user) {
      try {
        await api.delete(`/cart/items/${itemId}`);
        await fetchCart();
      } catch (e) {
        console.error('[CartContext] Remove API error', e);
      }
    } else {
      const newItems = cart.items.filter((i) => i.id !== itemId);
      await saveLocalCart({ items: newItems });
    }
  };

  const clearCart = async () => {
    setCart({ items: [] });
    await AsyncStorage.removeItem('karviyam_mobile_cart');
  };

  const itemCount = cart.items ? cart.items.reduce((acc, i) => acc + i.quantity, 0) : 0;
  const cartSubtotal = cart.items
    ? cart.items.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        cartSubtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
