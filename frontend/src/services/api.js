import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──
export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const changePassword = (old_password, new_password) =>
  api.post('/auth/change-password', { old_password, new_password })

// ── Services ──
export const getServicesStatus = () => api.get('/services/status')
export const getServiceStatus = (name) => api.get(`/services/status/${name}`)
export const serviceAction = (service, action) =>
  api.post('/services/action', { service, action })

// ── Integrations ──
export const getN8nWorkflows = () => api.get('/n8n/workflows')
export const getN8nExecutions = (workflowId, limit = 10) =>
  api.get('/n8n/executions', { params: { workflow_id: workflowId, limit } })
export const toggleN8nWorkflow = (workflowId, activate) =>
  api.post(`/n8n/workflow/${workflowId}/toggle`, { activate })

export const getOllamaModels = () => api.get('/ollama/models')
export const getOllamaRunning = () => api.get('/ollama/running')
export const getOllamaMemory = () => api.get('/ollama/memory')
export const ollamaUnload = (model) => api.post('/ollama/unload', { model })
export const ollamaDelete = (model) => api.post('/ollama/delete', { model })
export const ollamaPull = (model) => api.post('/ollama/pull', { model }, { timeout: 300000 })

export const getGhostStats = () => api.get('/ghost/stats')
export const getRagHealth = () => api.get('/rag/health')

// ── Docker ──
export const getDockerContainers = () => api.get('/docker/containers')
export const dockerAction = (container, action) =>
  api.post('/docker/action', { container, action })

// ── Digital Humans (A6.3) ──
export const getDhWorkers = () => api.get('/dh/workers')
export const getDhExecutionsActive = () => api.get('/dh/executions/active')
export const getDhBudget = () => api.get('/dh/budget')
export const getDhAgentsHealth = () => api.get('/dh/agents/health')

export default api
