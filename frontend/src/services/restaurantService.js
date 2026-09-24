import api from './api';

const restaurantService = {
  getAll: async (params = {}) => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  getAvailability: async (id, date, partySize) => {
    const response = await api.get(`/restaurants/${id}/availability`, {
      params: { date, party_size: partySize }
    });
    return response.data;
  },

  create: async (restaurantData) => {
    // Si es FormData (para subir imágenes), dejar el Content-Type por defecto
    const config = restaurantData instanceof FormData ? 
      {} : { headers: { 'Content-Type': 'application/json' } };
    
    const response = await api.post('/restaurants', restaurantData, config);
    return response.data;
  },

  update: async (id, restaurantData) => {
    // Si es FormData (para subir imágenes), dejar el Content-Type por defecto
    const config = restaurantData instanceof FormData ? 
      {} : { headers: { 'Content-Type': 'application/json' } };
    
    const response = await api.put(`/restaurants/${id}`, restaurantData, config);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/restaurants/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/restaurants/stats');
    return response.data;
  },
};

export default restaurantService;
