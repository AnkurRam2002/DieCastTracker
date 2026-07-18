import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dataService = {
  getAll: (params: any = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return api.get(`/api/models/data?${qs}`).then(res => res.data);
  },
  getStats: () => api.get('/api/models/stats').then(res => res.data),
  search: (query: string) => api.get(`/api/models/search?q=${query}`).then(res => res.data),
  addModel: (data: any) => api.post('/api/models/add', data).then(res => res.data),
  updateModel: (data: any) => api.put('/api/models/update', data).then(res => res.data),
  deleteModel: (serial_number: number) => api.delete('/api/models/delete', { data: { serial_number } }).then(res => res.data),
  getDropdownOptions: () => api.get('/api/models/dropdown-options').then(res => res.data),
};

export const brandService = {
  getAll: () => api.get('/api/brands').then(res => res.data),
  add: (data: any) => api.post('/api/brands/add', data).then(res => res.data),
  update: (id: string, name: string) => api.put(`/api/brands/${id}`, { name }).then(res => res.data),
};

export const seriesService = {
  getAll: () => api.get('/api/series/all').then(res => res.data),
  getLegacyConfig: () => api.get('/api/series').then(res => res.data),
  add: (data: any) => api.post('/api/series/add', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/api/series/${id}`, data).then(res => res.data),
  
  getAllSubseries: () => api.get('/api/series/subseries/all').then(res => res.data),
  addSubseries: (data: any) => api.post('/api/series/subseries/add', data).then(res => res.data),
  updateSubseries: (id: string, data: any) => api.put(`/api/series/subseries/${id}`, data).then(res => res.data),
};

export const preorderService = {
  getAll: (params: any = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return api.get(`/api/preorders?${qs}`).then(res => res.data);
  },
  getStats: () => api.get('/api/preorders/statistics').then(res => res.data),
  getSellers: () => api.get('/api/preorders/sellers').then(res => res.data),
  add: (data: any) => api.post('/api/preorders', data).then(res => res.data),
  update: (serial_number: number, updates: any) => api.put(`/api/preorders/${serial_number}`, updates).then(res => res.data),
  delete: (serial_number: number) => api.delete(`/api/preorders/${serial_number}`).then(res => res.data),
};

export const analyticsService = {
  getStatistics: () => api.get('/api/analytics').then(res => res.data),
};

export const authService = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }).then(res => res.data),
  register: (username: string, password: string) =>
    api.post('/api/auth/register', { username, password }).then(res => res.data),
  profile: () => api.get('/api/auth/profile').then(res => res.data),
  updatePreferences: (data: { primary_brand?: string | null, secondary_brand?: string | null, email?: string, emailRemindersEnabled?: boolean, emailReminderDay?: number }) => 
    api.put('/api/auth/preferences', data).then(res => res.data),
};

export default api;
