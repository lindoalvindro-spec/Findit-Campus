const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  try {
    const json = await response.json();
    if (!response.ok) {
      return { data: null, error: { message: json.message || 'Terjadi kesalahan pada server.' } };
    }
    return { data: json, error: null };
  } catch (err) {
    if (!response.ok) {
      return { data: null, error: { message: `Gagal memproses request. Status: ${response.status}` } };
    }
    return { data: null, error: null };
  }
};

export const apiClient = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(response);
    } catch (err) {
      console.error(`API GET ${endpoint} error:`, err);
      return { data: null, error: { message: 'Tidak dapat terhubung ke server backend.' } };
    }
  },

  post: async (endpoint, body) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      return await handleResponse(response);
    } catch (err) {
      console.error(`API POST ${endpoint} error:`, err);
      return { data: null, error: { message: 'Tidak dapat terhubung ke server backend.' } };
    }
  },

  put: async (endpoint, body) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      return await handleResponse(response);
    } catch (err) {
      console.error(`API PUT ${endpoint} error:`, err);
      return { data: null, error: { message: 'Tidak dapat terhubung ke server backend.' } };
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(response);
    } catch (err) {
      console.error(`API DELETE ${endpoint} error:`, err);
      return { data: null, error: { message: 'Tidak dapat terhubung ke server backend.' } };
    }
  }
};
