import api from './api';

export const couponService = {
  validateCoupon: async (code) => {
    const response = await api.get(`/coupons/validate/${code}`);
    return response.data;
  }
};
