import api from './api';

// Get or Create Persistent Anonymous Session ID
export const getOrCreateSessionId = () => {
  try {
    let sessId = localStorage.getItem('karviyam_session_id');
    if (!sessId) {
      sessId = 'ksess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('karviyam_session_id', sessId);
    }
    return sessId;
  } catch (e) {
    return 'ksess_fallback_session';
  }
};

// Track User Event (Search, View, AddToCart, Wishlist, etc.)
export const trackUserEvent = async (eventType, payload = {}) => {
  try {
    const sessionId = getOrCreateSessionId();
    await api.post('/analytics/event', {
      eventType,
      sessionId,
      ...payload
    }).catch(() => null);
  } catch (e) {}
};
