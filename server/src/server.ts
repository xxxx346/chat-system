import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { AppDataSource } from './config/database'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { setupSocket } from './socket'

dotenv.config()

// Ensure upload directories exist
const uploadDirs = ['uploads/voice', 'uploads/files']
uploadDirs.forEach(dir => {
  const p = path.join(__dirname, '..', dir)
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
})

// Routes
import authRoutes from './routes/auth'
import friendRoutes from './routes/friend'
import chatRoutes from './routes/chat'
import voiceRoutes from './routes/voice'
import fileRoutes from './routes/file'

app.use('/api/auth', authRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/conversations', chatRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/files', fileRoutes)

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket setup
setupSocket(io)

// Start server
const PORT = process.env.PORT || 3001

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully')
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Database connection failed:', err)
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without database)`)
    })
  })

export { io }
