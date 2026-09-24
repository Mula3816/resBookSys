import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// 默认走同源相对路径，由 React dev server 的 proxy 转发到后端（本地与端口转发访问均可用）
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos timeout
  // No establecer Content-Type por defecto para permitir FormData
});

// Interceptor para añadir token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('已发送请求:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => {
    console.log('已收到响应:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('请求出错:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 仅在已登录页面遇到 401 时才跳转登录页；登录页本身的 401（密码错误）不跳转，保留错误提示
      if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/register') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
