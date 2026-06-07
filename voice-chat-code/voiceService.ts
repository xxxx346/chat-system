import api from './api'

export const voiceService = {
  uploadVoice: (formData: FormData) => api.post('/voice/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getVoice: (id: number) => api.get(`/voice/${id}`, { responseType: 'blob' }),
}
