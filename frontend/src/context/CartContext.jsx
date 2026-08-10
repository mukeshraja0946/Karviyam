import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

const DEFAULT_SAMPLE_ITEMS = [
  {
    id: 101,
    productId: 1,
    product: {
      id: 1,
      name: 'Karviyam Cyberpunk Oversized Tee',
      price: 899,
      imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
    },
    productName: 'Karviyam Cyberpunk Oversized Tee',
    productImage: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    price: 899,
    quantity: 1,
    selectedSize: 'L',
    selectedColor: 'Neon Black'
  }
];

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { items: parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { items: DEFAULT_SAMPLE_ITEMS };
  });

  useEffect(() => {
    fetchCart();
    window.addEventListener('karviyam_cart_updated', fetchCart);
    return () => window.removeEventListener('karviyam_cart_updated', fetchCart);
  }, [user]);

  const fetchCart = async () => {
    if (!user) {
      loadLocalStorageCart();
      return;
    }
    try {
      const res = await api.get('/cart');
      const apiData = res.data ? res.data : res;
      const cartData = apiData.data !== undefined ? apiData.data : apiData;

      if (cartData && Array.isArray(cartData.items) && cartData.items.length > 0) {
        setCart(cartData);
        localStorage.setItem('karviyam_cart_items', JSON.stringify(cartData.items));
      } else {
        loadLocalStorageCart();
      }
    } catch (err) {
      console.error('Failed to fetch backend cart:', err);
      loadLocalStorageCart();
    }
  };

  const loadLocalStorageCart = () => {
    try {
      const saved = localStorage.getItem('karviyam_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart({ items: parsed });
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback if empty
    setCart({ items: DEFAULT_SAMPLE_ITEMS });
    localStorage.setItem('karviyam_cart_items', JSON.stringify(DEFAULT_SAMPLE_ITEMS));
  };

  const addToCart = async (target, quantity = 1, selectedSize = 'M', selectedColor = 'Standard') => {
    const productId = typeof target === 'object' && target !== null ? (target.id || target.productId) : target;
    const targetObj = typeof target === 'object' ? target : {};

    const newItem = {
      id: Date.now(),
      productId: Number(productId) || 1,
      product: {
        id: Number(productId) || 1,
        name: targetObj.name || targetObj.productName || 'Karviyam Premium Tee',
        price: targetObj.price || 899,
        imageUrl: targetObj.imageUrl || targetObj.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'
      },
      productName: targetObj.name || targetObj.productName || 'Karviyam Premium Tee',
      productImage: targetObj.imageUrl || targetObj.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      price: targetObj.price || 899,
      quantity: Number(quantity) || 1,
      selectedSize: selectedSize || 'M',
      selectedColor: selectedColor || 'Standard'
    };

    try {
      if (user) {
        await api.post('/cart/add', {
          productId: Number(productId),
          quantity: Number(quantity) || 1,
          selectedSize: selectedSize || null,
          selectedColor: selectedColor || null
        }).catch(() => {});
      }

      setCart(prev => {
        const current = Array.isArray(prev.items) ? prev.items : [];
        const existingIdx = current.findIndex(i => i.productId === newItem.productId && i.selectedSize === newItem.selectedSize);
        let updated = [];
        if (existingIdx > -1) {
          updated = [...current];
          updated[existingIdx].quantity += newItem.quantity;
        } else {
          updated = [...current, newItem];
        }
        localStorage.setItem('karviyam_cart_items', JSON.stringify(updated));
        return { items: updated };
      });

      toast.success('Added to your bag! 🛍️');
      return true;
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error('Failed to add item to bag');
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    try {
      if (user) {
        await api.put(`/cart/items/${itemId}?quantity=${quantity}`).catch(() => {});
      }
      setCart(prev => {
        const current = Array.isArray(prev.items) ? prev.items : [];
        const updated = current.map(i => i.id === itemId ? { ...i, quantity } : i);
        localStorage.setItem('karviyam_cart_items', JSON.stringify(updated));
        return { items: updated };
      });
    } catch (err) {
      console.error('Update quantity error:', err);
    }
  };

  const removeItem = async (itemId) => {
    try {
      if (user) {
        await api.delete(`/cart/items/${itemId}`).catch(() => {});
      }
      setCart(prev => {
        const current = Array.isArray(prev.items) ? prev.items : [];
        const updated = current.filter(i => i.id !== itemId);
        localStorage.setItem('karviyam_cart_items', JSON.stringify(updated));
        return { items: updated };
      });
      toast.success('Item removed from bag');
    } catch (err) {
      console.error('Remove item error:', err);
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        await api.delete('/cart/clear').catch(() => {});
      }
      setCart({ items: [] });
      localStorage.removeItem('karviyam_cart_items');
    } catch (err) {
      console.error('Clear cart error:', err);
      setCart({ items: [] });
      localStorage.removeItem('karviyam_cart_items');
    }
  };

  const itemsList = cart && Array.isArray(cart.items) ? cart.items : [];
  const itemCount = itemsList.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const cartSubtotal = itemsList.reduce((acc, item) => {
    const itemPrice = item.price || (item.product ? item.product.price : 0) || 0;
    return acc + (itemPrice * (item.quantity || 1));
  }, 0);

  return (
    <CartContext.Provider value={{
      cart: { ...cart, items: itemsList },
      itemCount,
      cartSubtotal,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
