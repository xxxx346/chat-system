import { Response } from 'express'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { AuthRequest } from '../middleware/auth'
import { success, error } from '../utils/response'
import { AppDataSource } from '../config/database'
import { Message } from '../models/Message'

const UPLOAD_DIR = path.join(__dirname, '../../uploads/voice')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function uploadVoice(req: AuthRequest, res: Response) {
  try {
    const { conversation_id } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

    if (!req.file && (!files || !files.audio)) {
      return error(res, 'Voice file required')
    }

    const file = req.file || (files?.audio ? files.audio[0] : null)
    if (!file) return error(res, 'Voice file required')

    const fileName = `${uuidv4()}.webm`
    const filePath = path.join(UPLOAD_DIR, fileName)
    fs.writeFileSync(filePath, file.buffer)

    const fileUrl = `/uploads/voice/${fileName}`
    const messageRepo = AppDataSource.getRepository(Message)

    const message = messageRepo.create({
      conversation_id: parseInt(conversation_id),
      sender_id: req.user!.userId,
      type: 'voice',
      file_url: fileUrl,
      file_size: file.size,
      file_name: fileName,
    })
    await messageRepo.save(message)

    return success(res, { ...message, file_url: fileUrl }, 'Voice uploaded')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function getVoice(req: AuthRequest, res: Response) {
  try {
    const messageRepo = AppDataSource.getRepository(Message)
    const message = await messageRepo.findOne({ where: { id: parseInt(req.params.id) } })
    if (!message || !message.file_url) return error(res, 'Voice not found', 404)

    const filePath = path.join(UPLOAD_DIR, path.basename(message.file_url))
    if (!fs.existsSync(filePath)) return error(res, 'File not found', 404)

    res.setHeader('Content-Type', 'audio/webm')
    res.sendFile(filePath)
  } catch (err: any) {
    return error(res, err.message)
  }
}
