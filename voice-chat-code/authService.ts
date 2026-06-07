import api from './api'

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  nickname?: string
}

export const authService = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
}
