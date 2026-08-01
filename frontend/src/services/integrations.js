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
