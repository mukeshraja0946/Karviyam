import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import api from '../services/api';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      loadLocalWishlist();
    }
  }, [user]);

  const loadLocalWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem('karviyam_mobile_wishlist');
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[WishlistContext] Load local error', e);
    }
  };

  const saveLocalWishlist = async (items) => {
    setWishlist(items);
    await AsyncStorage.setItem('karviyam_mobile_wishlist', JSON.stringify(items));
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.success && res.data) {
        setWishlist(res.data);
      }
    } catch (e) {
      console.error('[WishlistContext] Fetch error', e);
    }
  };

  const toggleWishlist = async (product) => {
    const isWishlisted = wishlist.some((item) => (item.product?.id || item.id) === product.id);
    
    if (user) {
      try {
        if (isWishlisted) {
          await api.delete(`/wishlist/${product.id}`);
        } else {
          await api.post(`/wishlist/${product.id}`);
        }
        await fetchWishlist();
      } catch (e) {
        console.error('[WishlistContext] Toggle API error', e);
      }
    } else {
      let updated;
      if (isWishlisted) {
        updated = wishlist.filter((item) => (item.product?.id || item.id) !== product.id);
      } else {
        updated = [...wishlist, product];
      }
      await saveLocalWishlist(updated);
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some((item) => (item.product?.id || item.id) === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
