import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s timeout for long operations (restart etc.)
})

export default api
