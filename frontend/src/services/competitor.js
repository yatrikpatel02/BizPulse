import api from './api';

export const getCompetitorPrices = async (params = {}) => {
  const response = await api.get('/integrations/competitor-prices/', { params });
  return response.data;
};

export const collectCompetitorPrices = async (data = {}) => {
  const response = await api.post('/integrations/competitor-prices/collect/', data);
  return response.data;
};

export const collectCompetitorData = async (payload = {}) => {
  const response = await api.post('/integrations/competitor-prices/collect/', payload);
  return response.data;
};
