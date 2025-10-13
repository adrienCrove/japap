// Configuration de l'API backend
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Endpoints d'authentification
export const AUTH_ENDPOINTS = {
  CHECK_USER: `${API_BASE_URL}/auth/check-user`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
};

// Endpoints des intérêts
export const INTERESTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/interests`,
  SEED: `${API_BASE_URL}/interests/seed`,
};

// Endpoints des alertes
export const ALERTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/alerts`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/alerts/${id}`,
  CREATE: `${API_BASE_URL}/alerts`,
  UPDATE: (id: string) => `${API_BASE_URL}/alerts/${id}`,
};
