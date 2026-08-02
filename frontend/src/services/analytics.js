import api from './api';

export const getSalesRecords = (params = {}) =>
  api.get('/analytics/sales/', { params }).then(r => r.data);

export const getInventorySnapshots = (params = {}) =>
  api.get('/analytics/inventory/', { params }).then(r => r.data);

export const getCustomerReviews = (params = {}) =>
  api.get('/analytics/reviews/', { params }).then(r => r.data);

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
