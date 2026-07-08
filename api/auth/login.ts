import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../../server/services/database'

const db = new DatabaseService('users.xlsx')

function sanitizeUser(user: any) {
  const { password, ...safeUser } = user
  return safeUser
}

async function ensureDefaultAdmin() {
  const users = await db.getAll()
  if (users.length > 0) return users

  const now = new Date().toISOString()
  const admin = {
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@nexxus.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    avatar: '',
    mobile: '+91 98765 43210',
    createdAt: now,
    updatedAt: now,
  }

  await db.create(admin)
  return [admin]
}

function readBody(req: any) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    await db.load()
    const { email, password } = readBody(req)
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const users = await ensureDefaultAdmin()
    const user = users.find((item: any) => String(item.email || '').toLowerCase() === normalizedEmail)

    if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error('Vercel login failed:', error)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}
