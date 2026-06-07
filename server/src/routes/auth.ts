import { Router } from 'express'
import { register, login, getProfile, updateProfile, logout } from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/profile', authMiddleware, getProfile)
router.put('/profile', authMiddleware, updateProfile)
router.post('/logout', authMiddleware, logout)

export default router
