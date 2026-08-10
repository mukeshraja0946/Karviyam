import api from './api';

export const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getProducts: async () => {
    const response = await api.get('/admin/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/admin/orders');
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/admin/orders/${id}/status?status=${status}`);
    return response.data;
  },

  getCoupons: async () => {
    const response = await api.get('/admin/coupons');
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post('/admin/coupons', couponData);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },

  getBanners: async () => {
    const response = await api.get('/banners/all');
    return response.data;
  },

  saveBanner: async (bannerData) => {
    const response = await api.post('/banners', bannerData);
    return response.data;
  },

  deleteBanner: async (id) => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getContactMessages: async () => {
    const response = await api.get('/contact');
    return response.data;
  }
};
