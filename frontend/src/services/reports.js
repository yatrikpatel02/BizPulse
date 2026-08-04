import api from './api';

export const getReports = async (params = {}) => {
  const response = await api.get('/reports/', { params });
  return response.data;
};

export const createReport = async (data) => {
  const response = await api.post('/reports/', data);
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/reports/${id}/`);
  return response.data;
};
