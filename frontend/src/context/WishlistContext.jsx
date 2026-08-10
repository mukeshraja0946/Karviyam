import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWishlist();
      window.addEventListener('karviyam_wishlist_updated', fetchWishlist);
      return () => window.removeEventListener('karviyam_wishlist_updated', fetchWishlist);
    } else {
      setWishlist([]);
      setWishlistCount(0);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await api.get('/wishlist');
      const apiData = res.data ? res.data : res;
      const items = apiData.data !== undefined ? apiData.data : apiData;
      if (Array.isArray(items)) {
        setWishlist(items);
        setWishlistCount(items.length);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    }
  };

  const isInWishlist = (target) => {
    if (!target) return false;
    const targetId = typeof target === 'object' && target !== null ? (target.id || target.productId) : target;
    if (!targetId) return false;
    return wishlist.some((item) => (item.id === targetId || item.productId === targetId));
  };

  const toggleWishlist = async (target) => {
    if (!user) {
      toast.error('Please sign in to add products to your wishlist.');
      return;
    }

    const productId = typeof target === 'object' && target !== null ? (target.id || target.productId) : target;
    if (!productId) {
      toast.error('Invalid product');
      return;
    }

    const currentlyIn = isInWishlist(productId);

    // Optimistic UI state update
    if (currentlyIn) {
      setWishlist(prev => prev.filter(item => item.id !== productId && item.productId !== productId));
      setWishlistCount(prev => Math.max(0, prev - 1));
      toast.success('Removed from wishlist');
    } else {
      const tempProduct = typeof target === 'object' && target !== null ? target : { id: productId };
      setWishlist(prev => [...prev, tempProduct]);
      setWishlistCount(prev => prev + 1);
      toast.success('Added to wishlist ❤️');
    }

    try {
      const res = await api.post(`/wishlist/toggle/${productId}`);
      const apiData = res.data ? res.data : res;
      if (apiData) {
        fetchWishlist();
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      // Revert on error
      fetchWishlist();
      const errorMsg = err.response?.data?.message || 'Failed to update wishlist';
      toast.error(errorMsg);
    }
  };

  const addToWishlist = async (target) => {
    if (!user) {
      toast.error('Please sign in to add products to your wishlist.');
      return;
    }
    const productId = typeof target === 'object' && target !== null ? (target.id || target.productId) : target;
    if (isInWishlist(productId)) return;
    await toggleWishlist(target);
  };

  const removeFromWishlist = async (target) => {
    if (!user) return;
    const productId = typeof target === 'object' && target !== null ? (target.id || target.productId) : target;
    if (!isInWishlist(productId)) return;
    await toggleWishlist(target);
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
