// src/services/api.js — Axios-based API service
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.response.use(
  r => r.data,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    throw err
  }
)

// ─── LEADS ──────────────────────────────────────────────────────────────────
export const leadsApi = {
  getAll: (status) => api.get('/leads/', { params: status ? { status } : {} }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads/', data),
  bulkCreate: (leads) => api.post('/leads/bulk', { leads }),
  seed: () => api.post('/leads/seed'),
  patch: (id, updates) => api.patch(`/leads/${id}`, updates),
}

// ─── AGENT ──────────────────────────────────────────────────────────────────
export const agentApi = {
  startCall: (lead_id, preferred_language) =>
    api.post('/agent/start-call', { lead_id, preferred_language }),
  
  sendMessage: (conversation_id, message) =>
    api.post('/agent/send-message', { conversation_id, message }),
  
  endCall: (conversation_id) =>
    api.post('/agent/end-call', { conversation_id }),
}

// ─── CONVERSATIONS ───────────────────────────────────────────────────────────
export const conversationsApi = {
  getOne: (id) => api.get(`/conversations/${id}`),
  getForLead: (lead_id) => api.get(`/conversations/lead/${lead_id}`),
  listAll: () => api.get('/conversations/'),
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  snapshot: () => api.get('/analytics/snapshot'),
  funnel: () => api.get('/analytics/funnel'),
  rmQueue: () => api.get('/analytics/rm-queue'),
}
