import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      // RFC 7807 ProblemDetail or Spring error format
      const data = error.response.data;
      if (data && data.detail) {
        message = data.detail;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && data.invalidFields) {
        const fields = Object.entries(data.invalidFields)
          .map(([field, err]) => `${field}: ${err}`)
          .join(', ');
        message = `Validation errors: ${fields}`;
      } else if (error.response.status === 403) {
        message = 'Access forbidden: you do not have permission for this resource.';
      } else if (error.response.status === 404) {
        message = 'Requested resource was not found.';
      }
    } else if (error.request) {
      message = 'Cannot connect to Solvence backend server. Please verify the backend is running.';
    }

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.original = error;
    return Promise.reject(enhancedError);
  }
);

export const api = {
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  getCategories: async () => {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  getTransactions: async () => {
    const res = await apiClient.get('/transactions');
    return res.data;
  },

  createTransaction: async (data) => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },

  deleteTransaction: async (id) => {
    await apiClient.delete(`/transactions/${id}`);
  },

  getRunwaySummary: async () => {
    const res = await apiClient.get('/runway/summary');
    return res.data;
  },
};

export default api;
