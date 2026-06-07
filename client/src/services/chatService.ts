import api from './api'

export const chatService = {
  getConversations: () => api.get('/conversations'),
  createConversation: (data: { type: string; name?: string; member_ids: number[] }) => api.post('/conversations', data),
  getMessages: (convId: number, page = 1, limit = 50) => api.get(`/conversations/${convId}/messages?page=${page}&limit=${limit}`),
  searchMessages: (convId: number, q: string) => api.get(`/conversations/${convId}/search?q=${encodeURIComponent(q)}`),
  exportMessages: (convId: number, format: 'json' | 'txt' = 'json') => api.get(`/conversations/${convId}/export?format=${format}`, { responseType: 'blob' }),
  updateConversation: (id: number, data: any) => api.put(`/conversations/${id}`, data),
  removeMember: (convId: number, userId: number) => api.delete(`/conversations/${convId}/members/${userId}`),
  getUnreadCount: () => api.get('/conversations/unread'),
  uploadFile: (formData: FormData) => api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
