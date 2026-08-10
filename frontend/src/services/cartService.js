import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (productId, quantity, selectedSize = null, selectedColor = null) => {
    const response = await api.post('/cart/add', {
      productId,
      quantity,
      selectedSize,
      selectedColor
    });
    return response.data;
  },

  updateQuantity: async (itemId, quantity) => {
    const response = await api.put(`/cart/update/${itemId}?quantity=${quantity}`);
    return response.data;
  },

  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/remove/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  }
};
