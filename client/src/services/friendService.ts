import api from './api'

export const friendService = {
  getFriends: () => api.get('/friends'),
  searchUsers: (q: string) => api.get(`/friends/search?q=${encodeURIComponent(q)}`),
  sendRequest: (receiver_id: number, message?: string) => api.post('/friends/requests', { receiver_id, message }),
  getRequests: () => api.get('/friends/requests'),
  handleRequest: (id: number, action: 'accepted' | 'rejected') => api.put(`/friends/requests/${id}`, { action }),
  resendRequest: (id: number) => api.post(`/friends/requests/${id}/resend`),
  moveFriend: (id: number, group_id: number | null) => api.put(`/friends/${id}/move`, { group_id }),
  deleteFriend: (id: number) => api.delete(`/friends/${id}`),
  getGroups: () => api.get('/friends/groups'),
  createGroup: (name: string) => api.post('/friends/groups', { name }),
  renameGroup: (id: number, name: string) => api.put(`/friends/groups/${id}`, { name }),
  deleteGroup: (id: number) => api.delete(`/friends/groups/${id}`),
}
