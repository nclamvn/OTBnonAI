import api from './api';

const extract = (res) => res.data?.data ?? res.data;

export const importService = {
  batchImport: (data) => api.post('/import/batch', data).then(extract),
  queryData: (params) => api.get('/import/data', { params }).then(extract),
  getStats: (target) => api.get('/import/stats', { params: { target } }).then(extract),
  getAllStats: () => api.get('/import/all-stats').then(extract),
  deleteData: (data) => api.delete('/import/data', { data }).then(extract),
  deleteSession: (target, sessionId) => api.delete(`/import/session/${sessionId}`, { params: { target } }).then(extract),
  clearTarget: (target) => api.delete(`/import/clear/${target}`).then(extract),
};
