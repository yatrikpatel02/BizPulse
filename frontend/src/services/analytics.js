import api from './api';

export const getSalesAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/sales-analysis/', { params });
  return response.data;
};

export const getInventoryAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/inventory-analysis/', { params });
  return response.data;
};

export const getCustomerAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/customer-analysis/', { params });
  return response.data;
};

export const getPredictions = async (params = {}) => {
  const response = await api.get('/analytics/predictions/', { params });
  return response.data;
};

export const getInsights = async (params = {}) => {
  const response = await api.get('/analytics/insights/', { params });
  return response.data;
};
