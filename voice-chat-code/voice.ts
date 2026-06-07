import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { uploadVoice, getVoice } from '../controllers/voiceController'

const router = Router()
router.use(authMiddleware)

router.post('/upload', uploadVoice)
router.get('/:id', getVoice)

export default router
