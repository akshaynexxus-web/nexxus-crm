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
const allowedRoles = [
  'super_admin',
  'company_admin',
  'director',
  'general_manager',
  'sales_manager',
  'sales_executive',
  'purchase_manager',
  'purchase_executive',
  'accounts_manager',
  'accounts_executive',
  'dispatch_manager',
  'production_manager',
  'hr_manager',
  'marketing_manager',
  'customer_support',
  'viewer',
  'auditor',
  'admin',
  'manager',
]

function sanitizeUser(user: any) {
  const { password, ...safeUser } = user
  return safeUser
}

function pickValue(row: Record<string, any>, key: string) {
  const normalizedKey = Object.keys(row).find((item) => item.toLowerCase().replace(/\s+/g, '') === key.toLowerCase())
  return normalizedKey ? row[normalizedKey] : ''
}

function pickUserField(body: any, current: any, field: string, fallback = '') {
  return body[field] ?? current?.[field] ?? fallback
}

function normalizeRole(role: string) {
  return allowedRoles.includes(role) ? role : 'sales_executive'
}

function buildUserPayload(body: any, current: any = {}) {
  return {
    name: pickUserField(body, current, 'name'),
    employeeId: pickUserField(body, current, 'employeeId'),
    email: pickUserField(body, current, 'email'),
    role: normalizeRole(pickUserField(body, current, 'role', 'sales_executive')),
    avatar: pickUserField(body, current, 'avatar'),
    mobile: pickUserField(body, current, 'mobile'),
    department: pickUserField(body, current, 'department'),
    designation: pickUserField(body, current, 'designation'),
    reportingManager: pickUserField(body, current, 'reportingManager'),
    status: pickUserField(body, current, 'status', 'active'),
    joiningDate: pickUserField(body, current, 'joiningDate'),
    officeLocation: pickUserField(body, current, 'officeLocation'),
    timeZone: pickUserField(body, current, 'timeZone', 'Asia/Kolkata'),
    language: pickUserField(body, current, 'language', 'English'),
    signature: pickUserField(body, current, 'signature'),
    sendWelcomeEmail: String(pickUserField(body, current, 'sendWelcomeEmail', false)),
    forcePasswordChange: String(pickUserField(body, current, 'forcePasswordChange', false)),
    twoFactorEnabled: String(pickUserField(body, current, 'twoFactorEnabled', false)),
    allowMobileLogin: String(pickUserField(body, current, 'allowMobileLogin', true)),
    allowDesktopLogin: String(pickUserField(body, current, 'allowDesktopLogin', true)),
    lastLogin: pickUserField(body, current, 'lastLogin'),
    createdBy: pickUserField(body, current, 'createdBy', 'system'),
  }
}

async function ensureDefaultAdmin() {
  const users = await db.getAll()
  if (users.length > 0) return users

  const now = new Date().toISOString()
  const admin = {
    id: uuidv4(),
    name: 'Admin User',
    employeeId: 'ADM-001',
    email: 'admin@nexxus.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    avatar: '',
    mobile: '+91 98765 43210',
    department: 'Management',
    designation: 'Super Admin',
    reportingManager: '',
    status: 'active',
    joiningDate: '',
    officeLocation: 'Head Office',
    timeZone: 'Asia/Kolkata',
    language: 'English',
    signature: '',
    sendWelcomeEmail: 'false',
    forcePasswordChange: 'false',
    twoFactorEnabled: 'false',
    allowMobileLogin: 'true',
    allowDesktopLogin: 'true',
    lastLogin: '',
    createdBy: 'system',
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
    
    const now = new Date().toISOString()
    await db.update(user.id, { lastLogin: now, updatedAt: now })

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
        department: user.department,
        status: user.status,
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
      const name = String(pickValue(row, 'name') || pickValue(row, 'fullname') || '').trim()
      const password = String(pickValue(row, 'password') || '').trim()
      const role = String(pickValue(row, 'role') || 'sales_executive').trim().toLowerCase().replace(/\s+/g, '_')

      if (!email || !name || password.length < 6 || existingEmails.has(email)) continue

      await db.create({
        id: uuidv4(),
        ...buildUserPayload({
          name,
          employeeId: String(pickValue(row, 'employeeid') || ''),
          email,
          role,
          avatar: String(pickValue(row, 'avatar') || pickValue(row, 'profilephoto') || ''),
          mobile: String(pickValue(row, 'mobile') || pickValue(row, 'mobilenumber') || ''),
          department: String(pickValue(row, 'department') || ''),
          designation: String(pickValue(row, 'designation') || ''),
          reportingManager: String(pickValue(row, 'reportingmanager') || ''),
          status: String(pickValue(row, 'status') || 'active'),
          joiningDate: String(pickValue(row, 'joiningdate') || ''),
          officeLocation: String(pickValue(row, 'officelocation') || ''),
          timeZone: String(pickValue(row, 'timezone') || 'Asia/Kolkata'),
          language: String(pickValue(row, 'language') || 'English'),
        }),
        password: await bcrypt.hash(password, 10),
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
    const { name, email, password } = req.body
    const users = await ensureDefaultAdmin()

    if (users.some((user: any) => user.email === email)) {
      return res.status(409).json({ success: false, error: 'Email already exists' })
    }

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Name, email, and a 6 character password are required' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = {
      id: uuidv4(),
      ...buildUserPayload(req.body),
      password: hashedPassword,
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
      ...buildUserPayload(req.body, current),
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
