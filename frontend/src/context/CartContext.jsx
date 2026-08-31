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

const DEFAULT_PRODUCT_PLACEHOLDER = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800';

export const normalizeCartItem = (item) => {
  if (!item || typeof item !== 'object') return null;

  const pId = item.productId || item.product_id || item.product?.id || item.id || 0;
  const pName = item.productName || item.product_name || item.product?.name || item.name || 'Karviyam Product';
  const pPrice = Number(item.price || item.product?.price || 0);
  const pImg = item.imageUrl || item.image_url || item.imagePath || item.image || item.productImage || item.product?.imageUrl || item.product?.image || DEFAULT_PRODUCT_PLACEHOLDER;
  const qty = Math.max(1, Number(item.quantity) || 1);

  return {
    id: item.id || `cart-item-${pId}`,
    productId: pId,
    productName: pName,
    price: pPrice,
    imageUrl: pImg,
    productImage: pImg,
    quantity: qty,
    selectedSize: item.selectedSize || item.selected_size || 'M',
    selectedColor: item.selectedColor || item.selected_color || 'Standard',
    product: {
      id: pId,
      name: pName,
      price: pPrice,
      imageUrl: pImg,
      image: pImg
    }
  };
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const norm = parsed.map(normalizeCartItem).filter(Boolean);
          return { items: norm };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { items: DEFAULT_SAMPLE_ITEMS.map(normalizeCartItem).filter(Boolean) };
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
      const apiData = res?.data ? res.data : res;
      const cartData = apiData?.data !== undefined ? apiData.data : apiData;

      if (cartData && Array.isArray(cartData.items) && cartData.items.length > 0) {
        const normalized = cartData.items.map(normalizeCartItem).filter(Boolean);
        setCart({ ...cartData, items: normalized });
        localStorage.setItem('karviyam_cart_items', JSON.stringify(normalized));
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
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map(normalizeCartItem).filter(Boolean);
          setCart({ items: normalized });
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setCart({ items: [] });
  };

  const addToCart = async (target, quantity = 1, selectedSize = 'M', selectedColor = 'Standard') => {
    const productId = typeof target === 'object' && target !== null ? (target.id || target.productId) : target;
    const targetObj = typeof target === 'object' && target !== null ? target : {};

    const rawItem = {
      id: Date.now(),
      productId: Number(productId) || 1,
      productName: targetObj.name || targetObj.productName || targetObj.title || 'Karviyam Item',
      price: Number(targetObj.price || 0),
      imageUrl: targetObj.imageUrl || targetObj.image || targetObj.imagePath || DEFAULT_PRODUCT_PLACEHOLDER,
      quantity: Number(quantity) || 1,
      selectedSize: selectedSize || 'M',
      selectedColor: selectedColor || 'Standard'
    };

    const newItem = normalizeCartItem(rawItem);

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
        const current = Array.isArray(prev?.items) ? prev.items : [];
        const existingIdx = current.findIndex(i => i && i.productId === newItem.productId && i.selectedSize === newItem.selectedSize);
        let updated = [];
        if (existingIdx > -1) {
          updated = [...current];
          updated[existingIdx] = normalizeCartItem({
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + newItem.quantity
          });
        } else {
          updated = [...current, newItem];
        }
        const cleanUpdated = updated.map(normalizeCartItem).filter(Boolean);
        localStorage.setItem('karviyam_cart_items', JSON.stringify(cleanUpdated));
        return { items: cleanUpdated };
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
        const current = Array.isArray(prev?.items) ? prev.items : [];
        const updated = current.map(i => i && i.id === itemId ? normalizeCartItem({ ...i, quantity }) : i).filter(Boolean);
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
        const current = Array.isArray(prev?.items) ? prev.items : [];
        const updated = current.filter(i => i && i.id !== itemId).map(normalizeCartItem).filter(Boolean);
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
      localStorage.setItem('karviyam_cart_items', JSON.stringify([]));
    } catch (err) {
      console.error('Clear cart error:', err);
      setCart({ items: [] });
      localStorage.setItem('karviyam_cart_items', JSON.stringify([]));
    }
  };

  const itemsList = cart && Array.isArray(cart.items) ? cart.items.map(normalizeCartItem).filter(Boolean) : [];
  const itemCount = itemsList.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0);
  const cartSubtotal = itemsList.reduce((acc, item) => {
    const itemPrice = Number(item?.price || item?.product?.price || 0);
    return acc + (itemPrice * (Number(item?.quantity) || 1));
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
