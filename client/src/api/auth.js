import axios from 'axios';

// Use relative URL — CRA proxy handles /api -> localhost:5000 in dev
// In production, set REACT_APP_API_URL env var to your backend URL
const BASE = process.env.REACT_APP_API_URL || '';

const API = axios.create({ baseURL: `${BASE}/api` });

API.interceptors.request.use(cfg => {
  const saved = localStorage.getItem('mb_session');
  if (saved) {
    try { cfg.headers.Authorization = `Bearer ${JSON.parse(saved).token}`; } catch {}
  }
  return cfg;
});

export const loginUser       = (data)      => API.post('/auth/login', data);
export const registerUser    = (data)      => API.post('/auth/register', data);

export const getVents        = ()          => API.get('/vents');
export const postVent        = (data)      => API.post('/vents', data);
export const reactToVent     = (id, emoji) => API.post(`/vents/${id}/react`, { emoji });

export const logMood         = (data)      => API.post('/mood', data);
export const getMoodLogs     = ()          => API.get('/mood/me');
export const getTodayMoods   = ()          => API.get('/mood/today');

export const getVolunteers   = ()          => API.get('/volunteers');
export const saveChatSession = (data)      => API.post('/volunteers/chat', data);

export const getClinics      = ()          => API.get('/clinics');
export const bookClinic      = (id)        => API.post(`/clinics/${id}/book`);

export const getStats        = ()          => API.get('/stats');
export const getHealthCard   = ()          => API.get('/healthcard/me');
