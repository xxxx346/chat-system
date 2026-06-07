import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getConversations, createConversation, getMessages, searchMessages,
  exportMessages, updateConversation, removeMember, getUnreadCount,
} from '../controllers/chatController'

const router = Router()
router.use(authMiddleware)

router.get('/unread', getUnreadCount)
router.get('/', getConversations)
router.post('/', createConversation)
router.get('/:id/messages', getMessages)
router.get('/:id/search', searchMessages)
router.get('/:id/export', exportMessages)
router.put('/:id', updateConversation)
router.delete('/:id/members/:userId', removeMember)

export default router
