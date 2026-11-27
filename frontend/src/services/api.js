import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const authAPI = {
  login: async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password });
    return res.data;
  },
};

export const analyticsAPI = {
  getOverview: async (filters = {}) => {
    const params = {};
    if (filters.year && filters.year !== 'All') params.year = Number(filters.year);
    if (filters.branch && filters.branch !== 'All') params.branch = filters.branch;
    if (filters.class_year && filters.class_year !== 'All') params.class_year = filters.class_year;
    if (filters.section && filters.section !== 'All') params.section = filters.section;
    if (filters.tier && filters.tier !== 'All') params.tier = filters.tier;
    const res = await api.get('/api/analytics/overview', { params });
    return res.data;
  },
  getCharts: async (filters = {}) => {
    const params = {};
    if (filters.year && filters.year !== 'All') params.year = Number(filters.year);
    if (filters.branch && filters.branch !== 'All') params.branch = filters.branch;
    if (filters.class_year && filters.class_year !== 'All') params.class_year = filters.class_year;
    if (filters.section && filters.section !== 'All') params.section = filters.section;
    if (filters.tier && filters.tier !== 'All') params.tier = filters.tier;
    const res = await api.get('/api/analytics/charts', { params });
    return res.data;
  },
};

export const studentAPI = {
  predict: async (profile) => {
    const res = await api.post('/api/student/predict', profile);
    return res.data;
  },
  getDirectory: async ({ q = '', branch = 'All', class_year = 'All', section = 'All', limit = 15 } = {}) => {
    const params = { limit };
    if (q) params.q = q;
    if (branch && branch !== 'All') params.branch = branch;
    if (class_year && class_year !== 'All') params.class_year = class_year;
    if (section && section !== 'All') params.section = section;
    const res = await api.get('/api/student/directory', { params });
    return res.data;
  },
  lookup: async (studentId) => {
    const res = await api.get(`/api/student/lookup/${encodeURIComponent(studentId)}`);
    return res.data;
  },
};

export const adminAPI = {
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/admin/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  downloadSampleCSV: async () => {
    const res = await api.get('/api/admin/sample-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'placement_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  getRecords: async ({
    search = '',
    branch = 'All',
    class_year = 'All',
    section = 'All',
    year = 'All',
    page = 1,
    limit = 10,
  } = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (branch && branch !== 'All') params.branch = branch;
    if (class_year && class_year !== 'All') params.class_year = class_year;
    if (section && section !== 'All') params.section = section;
    if (year && year !== 'All') params.year = Number(year);
    const res = await api.get('/api/admin/records', { params });
    return res.data;
  },
  createRecord: async (payload) => {
    const res = await api.post('/api/admin/records', payload);
    return res.data;
  },
  updateRecord: async (studentId, payload) => {
    const res = await api.put(`/api/admin/records/${encodeURIComponent(studentId)}`, payload);
    return res.data;
  },
  deleteRecord: async (studentId) => {
    const res = await api.delete(`/api/admin/records/${encodeURIComponent(studentId)}`);
    return res.data;
  },
  retrainModels: async () => {
    const res = await api.post('/api/admin/retrain');
    return res.data;
  },
};

export default api;
