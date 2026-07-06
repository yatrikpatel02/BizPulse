import api from './api';

export const getBusinesses = async () => {
  const response = await api.get('/businesses/');
  return response.data;
};

export const createBusiness = async (businessData) => {
  const response = await api.post('/businesses/', businessData);
  return response.data;
};

export const getBusiness = async (id) => {
  const response = await api.get(`/businesses/${id}/`);
  return response.data;
};

export const updateBusiness = async (id, businessData) => {
  const response = await api.put(`/businesses/${id}/`, businessData);
  return response.data;
};

export const deleteBusiness = async (id) => {
  const response = await api.delete(`/businesses/${id}/`);
  return response.data;
};
