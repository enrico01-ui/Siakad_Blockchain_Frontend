// src/services/api.js
import axios from 'axios'

const api = axios.create({ baseURL: 'https://seems-reserved-discounts-indicator.trycloudflare.com/api' })

// Otomatis tambah token di setiap request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Kalau token expired, redirect ke login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
