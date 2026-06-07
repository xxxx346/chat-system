import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { success, error } from '../utils/response'

export async function uploadFile(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return error(res, 'File required')
    }
    return success(res, {
      file_url: '/uploads/files/' + req.file.filename,
      file_name: req.file.originalname,
      file_size: req.file.size,
    }, 'File uploaded')
  } catch (err: any) {
    return error(res, err.message)
  }
}
