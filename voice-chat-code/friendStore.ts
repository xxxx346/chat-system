import { create } from 'zustand'

interface FriendGroup {
  id: number
  name: string
  sort_order: number
  friends: any[]
}

interface FriendRequest {
  id: number
  sender_id: number
  receiver_id: number
  status: string
  message: string
  created_at: string
  sender?: any
  receiver?: any
}

interface FriendState {
  groups: FriendGroup[]
  requests: { sent: FriendRequest[]; received: FriendRequest[] }
  setGroups: (groups: FriendGroup[]) => void
  setRequests: (requests: { sent: FriendRequest[]; received: FriendRequest[] }) => void
  addRequest: (request: FriendRequest) => void
  removeRequest: (id: number) => void
}

export const useFriendStore = create<FriendState>((set) => ({
  groups: [],
  requests: { sent: [], received: [] },
  setGroups: (groups) => set({ groups }),
  setRequests: (requests) => set({ requests }),
  addRequest: (request) =>
    set((state) => ({
      requests: { ...state.requests, received: [request, ...state.requests.received] },
    })),
  removeRequest: (id) =>
    set((state) => ({
      requests: {
        sent: state.requests.sent.filter((r) => r.id !== id),
        received: state.requests.received.filter((r) => r.id !== id),
      },
    })),
}))
