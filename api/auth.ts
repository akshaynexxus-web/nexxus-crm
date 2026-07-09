import { createId, readBody, requireServerlessAdmin, sanitizeUser, users } from './_auth-store'

function normalizeRole(role: unknown) {
  return String(role || 'sales_executive').trim().toLowerCase().replace(/\s+/g, '_')
}

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(204).end()
  }

  if (!requireServerlessAdmin(req, res)) return

  if (req.method === 'GET') {
    return res.status(200).json(users.map(sanitizeUser))
  }

  if (req.method === 'POST') {
    const body = readBody(req.body)
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Name, email, and a 6 character password are required' })
    }

    if (users.some((user) => user.email.toLowerCase() === email)) {
      return res.status(409).json({ success: false, error: 'Email already exists' })
    }

    const now = new Date().toISOString()
    const user = {
      id: createId(),
      name,
      employeeId: String(body.employeeId || ''),
      email,
      password,
      role: normalizeRole(body.role),
      avatar: String(body.avatar || ''),
      mobile: String(body.mobile || ''),
      department: String(body.department || ''),
      designation: String(body.designation || ''),
      reportingManager: String(body.reportingManager || ''),
      status: String(body.status || 'active'),
      joiningDate: String(body.joiningDate || ''),
      officeLocation: String(body.officeLocation || ''),
      timeZone: String(body.timeZone || 'Asia/Kolkata'),
      language: String(body.language || 'English'),
      signature: String(body.signature || ''),
      sendWelcomeEmail: Boolean(body.sendWelcomeEmail),
      forcePasswordChange: Boolean(body.forcePasswordChange),
      twoFactorEnabled: Boolean(body.twoFactorEnabled),
      allowMobileLogin: body.allowMobileLogin !== false,
      allowDesktopLogin: body.allowDesktopLogin !== false,
      lastLogin: '',
      createdBy: String(body.createdBy || 'admin'),
      createdAt: now,
      updatedAt: now,
    }

    users.unshift(user)
    return res.status(200).json({ success: true, data: sanitizeUser(user) })
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS')
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
