import { readBody, requireServerlessAdmin, sanitizeUser, users } from '../_auth-store'

function getId(req: any) {
  const value = req.query?.id
  return Array.isArray(value) ? value[0] : String(value || '')
}

function normalizeRole(role: unknown, fallback: string) {
  return String(role || fallback || 'sales_executive').trim().toLowerCase().replace(/\s+/g, '_')
}

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'PUT, DELETE, OPTIONS')
    return res.status(204).end()
  }

  if (!requireServerlessAdmin(req, res)) return

  const id = getId(req)
  const index = users.findIndex((user) => user.id === id)

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }

  if (req.method === 'PUT') {
    const body = readBody(req.body)
    const email = body.email ? String(body.email).trim().toLowerCase() : users[index].email

    if (users.some((user) => user.email.toLowerCase() === email && user.id !== id)) {
      return res.status(409).json({ success: false, error: 'Email already exists' })
    }

    const updated = {
      ...users[index],
      name: body.name ?? users[index].name,
      employeeId: body.employeeId ?? users[index].employeeId,
      email,
      password: body.password || users[index].password,
      role: normalizeRole(body.role, users[index].role),
      avatar: body.avatar ?? users[index].avatar,
      mobile: body.mobile ?? users[index].mobile,
      department: body.department ?? users[index].department,
      designation: body.designation ?? users[index].designation,
      reportingManager: body.reportingManager ?? users[index].reportingManager,
      status: body.status ?? users[index].status,
      joiningDate: body.joiningDate ?? users[index].joiningDate,
      officeLocation: body.officeLocation ?? users[index].officeLocation,
      timeZone: body.timeZone ?? users[index].timeZone,
      language: body.language ?? users[index].language,
      signature: body.signature ?? users[index].signature,
      sendWelcomeEmail: body.sendWelcomeEmail ?? users[index].sendWelcomeEmail,
      forcePasswordChange: body.forcePasswordChange ?? users[index].forcePasswordChange,
      twoFactorEnabled: body.twoFactorEnabled ?? users[index].twoFactorEnabled,
      allowMobileLogin: body.allowMobileLogin ?? users[index].allowMobileLogin,
      allowDesktopLogin: body.allowDesktopLogin ?? users[index].allowDesktopLogin,
      updatedAt: new Date().toISOString(),
    }

    users[index] = updated
    return res.status(200).json({ success: true, data: sanitizeUser(updated) })
  }

  if (req.method === 'DELETE') {
    if (users[index].role === 'admin' && users.filter((user) => user.role === 'admin').length <= 1) {
      return res.status(400).json({ success: false, error: 'At least one admin user is required' })
    }

    users.splice(index, 1)
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', 'PUT, DELETE, OPTIONS')
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
