import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { upload } from '../utils/upload'
import { uploadFile } from '../controllers/fileController'

const router = Router()
router.use(authMiddleware)

router.post('/upload', upload.single('file'), uploadFile)

export default router
