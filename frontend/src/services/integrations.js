import api from './api';

export const uploadFile = async (file, sourceType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_type', sourceType);

  const response = await api.post('/integrations/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getImportPreview = async (tempFileId, sourceType, mapping) => {
  const response = await api.post('/integrations/import/preview/', {
    temp_file_id: tempFileId,
    source_type: sourceType,
    mapping,
  });
  return response.data;
};

export const commitImport = async (tempFileId, sourceType, mapping, originalFilename) => {
  const endpoint = `/integrations/import/${sourceType}/`;
  const response = await api.post(endpoint, {
    temp_file_id: tempFileId,
    mapping,
    original_filename: originalFilename,
  });
  return response.data;
};

export const getMarketKeywords = async (params = {}) => {
  const response = await api.get('/integrations/market-keywords/', { params });
  return response.data;
};

export const createMarketKeyword = async (data) => {
  const response = await api.post('/integrations/market-keywords/', data);
  return response.data;
};

export const updateMarketKeyword = async (id, data) => {
  const response = await api.patch(`/integrations/market-keywords/${id}/`, data);
  return response.data;
};

export const deleteMarketKeyword = async (id) => {
  const response = await api.delete(`/integrations/market-keywords/${id}/`);
  return response.data;
};

export const analyzeMarketIntelligence = async (params = {}) => {
  const response = await api.post('/analytics/market-insights/', {}, { params });
  return response.data;
};
