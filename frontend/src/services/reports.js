import api from './api';

export const getReports = (params = {}) => {
  return api.get('/reports/', { params });
};

export const createReport = (data) => {
  return api.post('/reports/', data);
};

export const deleteReport = (id) => {
  return api.delete(`/reports/${id}/`);
};
