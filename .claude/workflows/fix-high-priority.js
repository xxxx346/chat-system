export const meta = {
  name: 'fix-high-priority',
  description: 'Fix message persistence, logout, file upload, group UI, read status, unread count',
  phases: [
    { title: 'Backend', detail: 'Message persistence, logout API, file upload, unread count' },
    { title: 'Frontend', detail: 'Group creation, read status, unread badge, file upload UI, logout flow' },
  ],
}

const BACKEND_PROMPT = `
You are fixing the backend of a chat system at e:/codeai/chat-system/server/src/

Tech stack: Express, TypeScript, TypeORM, MySQL, Socket.IO

## Task 1: Fix message persistence in socket/index.ts (CRITICAL)

File: e:/codeai/chat-system/server/src/socket/index.ts

Current bug: 'message:send' handler only broadcasts without saving to DB. All messages lost on refresh.

Add these imports at the top (after existing imports):
- AppDataSource from '../config/database'
- Message from '../models/Message'
- Conversation from '../models/Conversation'
- ConversationMember from '../models/ConversationMember'
- MessageStatus from '../models/MessageStatus'
- User from '../models/User'

Rewrite the 'message:send' handler:
1. Validate data.sender_id === userId (prevent spoofing)
2. Create and save Message entity to DB (conversation_id, sender_id, type, content, file_url, file_size, file_name)
3. Update Conversation record: set last_message and last_message_time to current timestamp
4. Find all ConversationMember records for this conversation
5. Create MessageStatus records (status='delivered') for members other than sender
6. Look up sender User info (id, username, nickname, avatar)
7. Broadcast 'message:new' to the room with the saved message (now has real id and created_at)
8. Wrap in try/catch with console.error

Rewrite the 'message:read' handler:
- Update MessageStatus in DB: set status='read' and read_at to current timestamp
- Filter by message_id and current socket's userId
- Broadcast 'message:read:ack' to room

Keep onlineUsers map, user:online/offline, typing, voice call, and disconnect handlers unchanged.

## Task 2: Add logout API

File: e:/codeai/chat-system/server/src/controllers/authController.ts
- Add a logout function: use userRepo to update user status to 'offline', return success

File: e:/codeai/chat-system/server/src/routes/auth.ts
- Import logout, add POST /logout route with authMiddleware

## Task 3: Add file upload

NEW FILE: e:/codeai/chat-system/server/src/utils/upload.ts
- multer diskStorage config, destination 'uploads/files/', uuid filename with original extension
- 50MB limit, ensure directory exists

NEW FILE: e:/codeai/chat-system/server/src/controllers/fileController.ts
- export uploadFile function: check req.file, return file_url/file_name/file_size

NEW FILE: e:/codeai/chat-system/server/src/routes/file.ts
- POST /upload with upload.single('file') middleware, authMiddleware

File: e:/codeai/chat-system/server/src/server.ts
- Import fileRoutes, register at /api/files
- Ensure uploads/voice and uploads/files directories exist at startup using fs

## Task 4: Add unread count API

File: e:/codeai/chat-system/server/src/controllers/chatController.ts
- Add getUnreadCount function:
  Query MessageStatus where user_id=currentUser and status='sent'
  Inner join with Message to get conversation_id
  Group by conversation_id, return count per conversation
  Use createQueryBuilder for efficiency

File: e:/codeai/chat-system/server/src/routes/chat.ts
- Import getUnreadCount, add GET /unread route (BEFORE the /:id routes)

IMPORTANT: Read each file before editing. Make focused changes, keep existing code.
`

const FRONTEND_PROMPT = `
You are fixing the frontend of a chat system at e:/codeai/chat-system/client/src/

Tech: React 18, TypeScript, Ant Design 5, Zustand, Socket.IO Client

## Task 1: Fix SocketService

File: e:/codeai/chat-system/client/src/services/socketService.ts

Add these NEW methods (keep all existing):
- offNewMessage(callback) { this.socket?.off('message:new', callback) }
- offTypingStart(callback) { this.socket?.off('typing:start', callback) }
- offTypingEnd(callback) { this.socket?.off('typing:end', callback) }
- offUserOnline(callback) { this.socket?.off('user:online', callback) }
- offUserOffline(callback) { this.socket?.off('user:offline', callback) }
- offVoiceOffer(callback) { this.socket?.off('voice:offer', callback) }
- offVoiceAnswer(callback) { this.socket?.off('voice:answer', callback) }
- offVoiceIceCandidate(callback) { this.socket?.off('voice:ice-candidate', callback) }
- offVoiceEnd(callback) { this.socket?.off('voice:end', callback) }
- offMessageRead(callback) { this.socket?.off('message:read:ack', callback) }
- sendMessageRead(data) { this.socket?.emit('message:read', data) }

## Task 2: Fix ChatPage

File: e:/codeai/chat-system/client/src/pages/ChatPage.tsx

Bugs: optimistic local add causes duplicates, socket listener never cleaned up (memory leak), no dedup.

Fix 1 - handleSendMessage: Remove the addMessage(msg) call. The message comes via socket broadcast. Only send via socket.

Fix 2 - Socket listener useEffect: Store handler as a const. Register with socketService.onNewMessage(handler). Return cleanup that calls socketService.offNewMessage(handler). Add dedup: check msg.id against existing messages before calling addMessage (use the messages array from the store).

Fix 3 - Add a new useEffect to mark messages as read:
When currentConversation changes and messages load, for each message where sender_id !== current user, emit socketService.sendMessageRead({ message_id: msg.id, conversation_id: currentConversation.id })

Fix 4 - Listen for 'message:read:ack' socket event:
Add a listener that calls setReadStatus(data.message_id) from chatStore

Import { useChatStore } from the chat store to access setReadStatus.

## Task 3: Fix logout flow

File: e:/codeai/chat-system/client/src/components/common/MainLayout.tsx
- Add import: import { authService } from '../../services/authService'
- Make handleLogout async: first call await authService.logout(), then disconnect and logout

## Task 4: Add CreateGroupModal

NEW FILE: e:/codeai/chat-system/client/src/components/chat/CreateGroupModal.tsx
- Props: visible, onClose, onCreated(convId: number)
- Group name Input
- Load friends from friendService.getFriends() when opened (flatten grouped data)
- Friend list with Checkbox selection
- On submit call chatService.createConversation({type:'group', name, member_ids})
- Use Ant Design Modal, Input, Checkbox, List, Avatar, Button, message, Typography
- Reset state on open

File: e:/codeai/chat-system/client/src/pages/ChatPage.tsx
- Import CreateGroupModal
- Add state: const [createGroupVisible, setCreateGroupVisible] = useState(false)
- In the sidebar header, add a button to open the modal
- On created, navigate to the new conversation

## Task 5: Read status in MessageBubble

File: e:/codeai/chat-system/client/src/store/chatStore.ts
- Add state: readByOthers: Record<number, boolean> = {}
- Add action: setReadStatus: (messageId: number) => set(state => ({ readByOthers: { ...state.readByOthers, [messageId]: true } }))

File: e:/codeai/chat-system/client/src/components/chat/MessageBubble.tsx
- Import useChatStore, get readByOthers
- For isOwn messages, below time add: if msg.id is in readByOthers show double-check (blue), else show single-check (gray)

File: e:/codeai/chat-system/client/src/pages/ChatPage.tsx
- Add message:read:ack socket listener that calls setReadStatus

## Task 6: Unread count

File: e:/codeai/chat-system/client/src/services/chatService.ts
- Add: getUnreadCount: () => api.get('/conversations/unread')
- Add: uploadFile: (formData) => api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

File: e:/codeai/chat-system/client/src/pages/ChatPage.tsx
- After loading conversations, load unread counts from chatService.getUnreadCount()
- Response: { code: 200, data: { [convId]: count } }
- Merge counts into conversation objects: conv.unread = counts[conv.id] || 0
- Also refresh unread counts when new messages arrive

## Task 7: File upload in MessageInput

File: e:/codeai/chat-system/client/src/components/chat/MessageInput.tsx

Make image/file upload work:
- Import chatService (or have it passed as prop / use inline import)
- Add handleFileUpload function that:
  1. Creates FormData with the file
  2. Calls chatService.uploadFile(formData)
  3. On success, determines type (image for image/*, file for others)
  4. Sends content as JSON string with file_url, file_name, file_size
  5. Calls onSend(jsonContent, type)
- Wire to Upload component's beforeUpload prop, return false to prevent default
- Show upload status feedback

## Task 8: Group management

File: e:/codeai/chat-system/client/src/components/chat/ChatWindow.tsx
- In the moreMenu, for group conversations add a "成员管理" option
- Show member count in header for groups (already partially done)
- Add a way to view conversation members

File: e:/codeai/chat-system/client/src/components/chat/ChatList.tsx
- Add "创建群聊" text button in the header area
- Accept onCreateGroup prop
- When clicked, call onCreateGroup()

IMPORTANT: Read each file before editing. Preserve existing code. Use Chinese for UI text labels.
`

phase('Backend & Frontend')
const [backend, frontend] = await parallel([
  () => agent(BACKEND_PROMPT, { label: 'Backend Implementation' }),
  () => agent(FRONTEND_PROMPT, { label: 'Frontend Implementation' }),
])

return { backend, frontend }
