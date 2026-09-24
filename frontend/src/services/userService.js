import api from './api';

const userService = {
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateRole: async (id, roleData) => {
    const response = await api.put(`/users/${id}/role`, roleData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/users/stats/dashboard', { params });
    return response.data;
  },
};

export default userService;
