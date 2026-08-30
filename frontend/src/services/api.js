import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('karviyam_cross_tab_sync')
  : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event && event.data && event.data.eventName) {
      window.dispatchEvent(new Event(event.data.eventName));
    }
  };
}

const broadcastSyncEvent = (eventName) => {
  window.dispatchEvent(new Event(eventName));
  try {
    syncChannel?.postMessage({ eventName });
  } catch (e) {}
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('karviyam_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Disable browser HTTP caching for all API calls
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';

    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const url = response.config?.url || '';

    // Automatically trigger global data synchronization events on any CUD mutation
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      window.dispatchEvent(new CustomEvent('karviyam_data_mutated', { detail: { url, method } }));

      if (url.includes('/settings')) {
        broadcastSyncEvent('karviyam_settings_updated');
        broadcastSyncEvent('karviyam_logo_updated');
        broadcastSyncEvent('karviyam_footer_updated');
      }
      if (url.includes('/categories')) {
        broadcastSyncEvent('karviyam_categories_updated');
      }
      if (url.includes('/products')) {
        broadcastSyncEvent('karviyam_products_updated');
      }
      if (url.includes('/banners')) {
        broadcastSyncEvent('karviyam_banners_updated');
      }
      if (url.includes('/coupons')) {
        broadcastSyncEvent('karviyam_coupons_updated');
      }
      if (url.includes('/pincodes')) {
        broadcastSyncEvent('karviyam_pincodes_updated');
      }
      if (url.includes('/reviews')) {
        broadcastSyncEvent('karviyam_reviews_updated');
      }
      if (url.includes('/orders')) {
        broadcastSyncEvent('karviyam_orders_updated');
      }
      if (url.includes('/cart')) {
        broadcastSyncEvent('karviyam_cart_updated');
      }
      if (url.includes('/wishlist')) {
        broadcastSyncEvent('karviyam_wishlist_updated');
      }
    }
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      try {
        localStorage.removeItem('karviyam_token');
        localStorage.removeItem('karviyam_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('karviyam_auth_unauthorized'));
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;

