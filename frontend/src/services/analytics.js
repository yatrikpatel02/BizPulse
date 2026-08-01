import api from './api';

export const getSalesRecords = (params = {}) =>
  api.get('/analytics/sales/', { params }).then(r => r.data);

export const getInventorySnapshots = (params = {}) =>
  api.get('/analytics/inventory/', { params }).then(r => r.data);

export const getCustomerReviews = (params = {}) =>
  api.get('/analytics/reviews/', { params }).then(r => r.data);
