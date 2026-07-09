export type ServerlessUser = {
  id: string
  name: string
  employeeId?: string
  email: string
  password?: string
  role: string
  avatar?: string
  mobile?: string
  department?: string
  designation?: string
  reportingManager?: string
  status?: string
  joiningDate?: string
  officeLocation?: string
  timeZone?: string
  language?: string
  signature?: string
  sendWelcomeEmail?: string | boolean
  forcePasswordChange?: string | boolean
  twoFactorEnabled?: string | boolean
  allowMobileLogin?: string | boolean
  allowDesktopLogin?: string | boolean
  lastLogin?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export const adminUser: ServerlessUser = {
  id: 'default-admin',
  name: 'Admin User',
  employeeId: 'ADM-001',
  email: 'admin@nexxus.com',
  password: 'admin123',
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
  sendWelcomeEmail: false,
  forcePasswordChange: false,
  twoFactorEnabled: false,
  allowMobileLogin: true,
  allowDesktopLogin: true,
  lastLogin: '',
  createdBy: 'system',
  createdAt: '2026-07-08T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:00.000Z',
}

export const users: ServerlessUser[] = [adminUser]

export function readBody(body: unknown) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return body && typeof body === 'object' ? body as Record<string, any> : {}
}

export function sanitizeUser(user: ServerlessUser) {
  const { password, ...safeUser } = user
  return safeUser
}

export function createToken(user: ServerlessUser) {
  return Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      issuedAt: Date.now(),
    })
  ).toString('base64url')
}

export function requireServerlessAdmin(req: any, res: any) {
  const header = String(req.headers?.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' })
    return false
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Admin access required' })
      return false
    }
    return true
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' })
    return false
  }
}

export function createId() {
  return `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
