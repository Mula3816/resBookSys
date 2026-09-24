import api from './api';

const reservationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/reservations', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  create: async (reservationData) => {
    const response = await api.post('/reservations', reservationData);
    return response.data;
  },

  updateStatus: async (id, status, notes) => {
    const response = await api.put(`/reservations/${id}/status`, { status, notes });
    return response.data;
  },

  recordPayment: async (id, paymentData) => {
    const response = await api.put(`/reservations/${id}/payment`, paymentData);
    return response.data;
  },

  cancel: async (id, reason) => {
    const response = await api.put(`/reservations/${id}/cancel`, { reason });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/reservations/${id}`);
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/reservations/stats/dashboard', { params });
    return response.data;
  },
};

export default reservationService;
