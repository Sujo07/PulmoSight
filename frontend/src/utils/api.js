import axios from 'axios'

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://mdbasimali440-pulmosight-backend.hf.space/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ps_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ps_token')
      localStorage.removeItem('ps_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
