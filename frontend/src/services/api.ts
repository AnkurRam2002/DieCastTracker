import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

export default api;

export const dataService = {
  getAll: () => api.get('/api/data').then(res => res.data),
  getStats: () => api.get('/api/stats').then(res => res.data),
  search: (query: string) => api.get(`/api/search?q=${query}`).then(res => res.data),
  addModel: (data: any) => api.post('/api/add-model', data).then(res => res.data),
  updateModel: (data: any) => api.put('/api/update-model', data).then(res => res.data),
  deleteModel: (serial_number: number) => api.delete('/api/delete-model', { data: { serial_number } }).then(res => res.data),
  getDropdownOptions: () => api.get('/api/dropdown-options').then(res => res.data),
};

export const preorderService = {
  getAll: () => api.get('/api/preorders').then(res => res.data),
  getStats: () => api.get('/api/preorders/statistics').then(res => res.data),
  add: (data: any) => api.post('/api/preorders', data).then(res => res.data),
  update: (serial_number: number, updates: any) => api.put(`/api/preorders/${serial_number}`, updates).then(res => res.data),
  delete: (serial_number: number) => api.delete(`/api/preorders/${serial_number}`).then(res => res.data),
};

export const analyticsService = {
  getStatistics: () => api.get('/api/analytics').then(res => res.data),
};

export const seriesService = {
  getAll: () => api.get('/api/series').then(res => res.data),
  getConfig: () => api.get('/api/series').then(res => res.data),
  update: (data: any) => api.post('/api/series/update', data).then(res => res.data),
  rename: (data: any) => api.post('/api/series/rename', data).then(res => res.data),
  renameSubseries: (data: any) => api.post('/api/series/rename-subseries', data).then(res => res.data),
  add: (data: any) => api.post('/api/series/add', data).then(res => res.data),
};

export const authService = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data).then(res => res.data),
  signup: (data: { username: string; email: string; password: string }) =>
    api.post('/api/auth/signup', data).then(res => res.data),
  logout: () => api.post('/api/auth/logout').then(res => res.data),
  me: () => api.get('/api/auth/me').then(res => res.data),
};
