import axios from 'axios'

const api = axios.create({
  baseURL: '/admin/api',
  timeout: 60000,
})

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password })

// Services
export const getServicesStatus = () => api.get('/services/status')
export const getServiceStatus = (name) => api.get(`/services/status/${name}`)
export const serviceAction = (service, action) =>
  api.post('/services/action', { service, action })

// Integrations
export const getN8nWorkflows = () => api.get('/n8n/workflows')
export const getN8nExecutions = (workflowId, limit = 10) =>
  api.get('/n8n/executions', { params: { workflow_id: workflowId, limit } })
export const toggleN8nWorkflow = (workflowId, activate) =>
  api.post(`/n8n/workflow/${workflowId}/toggle`, { activate })
export const getOllamaModels = () => api.get('/ollama/models')
export const getGhostStats = () => api.get('/ghost/stats')
export const getRagHealth = () => api.get('/rag/health')

export default api
