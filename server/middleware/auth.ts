import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { role?: string }
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }

    next()
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}
