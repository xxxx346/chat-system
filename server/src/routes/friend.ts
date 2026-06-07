import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getFriends, searchUsers, sendFriendRequest, getFriendRequests,
  handleFriendRequest, moveFriendToGroup, deleteFriend, resendFriendRequest,
  getGroups, createGroup, renameGroup, deleteGroup,
} from '../controllers/friendController'

const router = Router()
router.use(authMiddleware)

router.get('/', getFriends)
router.get('/search', searchUsers)
router.post('/requests', sendFriendRequest)
router.get('/requests', getFriendRequests)
router.put('/requests/:id', handleFriendRequest)
router.post('/requests/:id/resend', resendFriendRequest)
router.put('/:id/move', moveFriendToGroup)
router.delete('/:id', deleteFriend)
router.get('/groups', getGroups)
router.post('/groups', createGroup)
router.put('/groups/:id', renameGroup)
router.delete('/groups/:id', deleteGroup)

export default router
