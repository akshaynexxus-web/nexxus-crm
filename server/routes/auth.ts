import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import XLSX from 'xlsx'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from '../middleware/auth'

const router = Router()
const db = new DatabaseService('users.xlsx')
const upload = multer({ storage: multer.memoryStorage() })

function sanitizeUser(user: any) {
  const { password, ...safeUser } = user
  return safeUser
}

function pickValue(row: Record<string, any>, key: string) {
  const normalizedKey = Object.keys(row).find((item) => item.toLowerCase().replace(/\s+/g, '') === key.toLowerCase())
  return normalizedKey ? row[normalizedKey] : ''
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

// Login
router.post('/login', async (req, res) => {
  try {
    await db.load()
    const { email, password } = req.body
    
    const users = await ensureDefaultAdmin()
    const user = users.find((u: any) => u.email === email)
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        mobile: user.mobile,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    await db.load()
    const { email } = req.body
    
    // In production, send email with reset link
    res.json({ success: true, message: 'Reset email sent' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Import users from Excel
router.post('/import', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Excel file is required' })
    }

    await db.load()
    const existingUsers = await ensureDefaultAdmin()
    const existingEmails = new Set(existingUsers.map((user: any) => String(user.email).toLowerCase()))
    const workbook = XLSX.read(req.file.buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' })
    const now = new Date().toISOString()
    let imported = 0

    for (const row of rows) {
      const email = String(pickValue(row, 'email') || '').trim().toLowerCase()
      const name = String(pickValue(row, 'name') || '').trim()
      const password = String(pickValue(row, 'password') || '').trim()
      const role = String(pickValue(row, 'role') || 'sales_executive').trim()

      if (!email || !name || password.length < 6 || existingEmails.has(email)) continue

      await db.create({
        id: uuidv4(),
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: ['admin', 'manager', 'sales_executive'].includes(role) ? role : 'sales_executive',
        avatar: String(pickValue(row, 'avatar') || ''),
        mobile: String(pickValue(row, 'mobile') || ''),
        createdAt: now,
        updatedAt: now,
      })
      existingEmails.add(email)
      imported += 1
    }

    res.json({ success: true, imported, skipped: rows.length - imported })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get all users
router.get('/', requireAdmin, async (req, res) => {
  try {
    await db.load()
    const users = await ensureDefaultAdmin()
    res.json(users.map(sanitizeUser))
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create user
router.post('/', requireAdmin, async (req, res) => {
  try {
    await db.load()
    const { name, email, password, role } = req.body
    const users = await ensureDefaultAdmin()

    if (users.some((user: any) => user.email === email)) {
      return res.status(409).json({ success: false, error: 'Email already exists' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      avatar: req.body.avatar || '',
      mobile: req.body.mobile || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await db.create(user)
    res.json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update user
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    await db.load()
    await ensureDefaultAdmin()
    const current = await db.getById(req.params.id)

    if (!current) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    const users = await db.getAll()
    if (req.body.email && users.some((user: any) => user.email === req.body.email && user.id !== req.params.id)) {
      return res.status(409).json({ success: false, error: 'Email already exists' })
    }

    const updates = {
      name: req.body.name ?? current.name,
      email: req.body.email ?? current.email,
      role: req.body.role ?? current.role,
      avatar: req.body.avatar ?? current.avatar,
      mobile: req.body.mobile ?? current.mobile,
      password: req.body.password ? await bcrypt.hash(req.body.password, 10) : current.password,
      updatedAt: new Date().toISOString(),
    }

    const user = await db.update(req.params.id, updates)
    res.json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete user
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.load()
    const users = await ensureDefaultAdmin()
    const admins = users.filter((user: any) => user.role === 'admin')
    const user = users.find((item: any) => item.id === req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    if (user.role === 'admin' && admins.length <= 1) {
      return res.status(400).json({ success: false, error: 'At least one admin user is required' })
    }

    const deleted = await db.delete(req.params.id)
    res.json({ success: deleted })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as authRoutes }
