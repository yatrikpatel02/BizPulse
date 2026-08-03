import api from './api';

export const register = async (userData) => {
  const response = await api.post('/accounts/register/', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/accounts/login/', credentials);
  return response.data;
};

export const socialLogin = async (token) => {
  const response = await api.post('/accounts/social/google/', { id_token: token });
  return response.data;
};

export const logout = async () => {
  await api.post('/accounts/logout/');
};

export const getProfile = async () => {
  const response = await api.get('/accounts/profile/');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/accounts/profile/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
