import { Response } from 'express'

export function success(res: Response, data: any = null, message: string = 'success') {
  return res.json({ code: 200, message, data })
}

export function error(res: Response, message: string = 'error', code: number = 400) {
  return res.status(code).json({ code, message })
}

export function unauthorized(res: Response, message: string = 'unauthorized') {
  return res.status(401).json({ code: 401, message })
}

export function notFound(res: Response, message: string = 'not found') {
  return res.status(404).json({ code: 404, message })
}
