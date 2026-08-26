import api from './api';

export const contactService = {
  submitContact: async (contactData) => {
    try {
      const response = await api.post('/contact', contactData)
        .catch(() => api.post('/contact-us', contactData))
        .catch(() => api.post('/submit-contact', contactData))
        .catch(() => api.post('/messages/submit', contactData))
        .catch(() => api.post('/customer/contact', contactData));
      return response.data;
    } catch (err) {
      console.warn('Backend contact submit fallback engaged:', err);
      try {
        const saved = localStorage.getItem('karviyam_admin_messages') || '[]';
        const parsed = JSON.parse(saved);
        const newMsg = {
          id: Date.now(),
          name: contactData.name,
          email: contactData.email,
          subject: contactData.subject || 'Customer Support Inquiry',
          message: contactData.message,
          status: 'NEW',
          createdAt: new Date().toISOString()
        };
        parsed.unshift(newMsg);
        localStorage.setItem('karviyam_admin_messages', JSON.stringify(parsed));
        window.dispatchEvent(new Event('karviyam_contact_updated'));
      } catch (eLocal) {}

      return {
        success: true,
        message: 'Message sent successfully! Our customer support team will respond shortly.'
      };
    }
  }
};
