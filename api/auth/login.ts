const adminUser = {
  id: 'default-admin',
  name: 'Admin User',
  email: 'admin@nexxus.com',
  role: 'admin',
  avatar: '',
  mobile: '+91 98765 43210',
  createdAt: '2026-07-08T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:00.000Z',
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
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { email, password } = readBody(req)
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (normalizedEmail !== adminUser.email || String(password || '') !== 'admin123') {
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  }

  const token = Buffer.from(
    JSON.stringify({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      issuedAt: Date.now(),
    })
  ).toString('base64url')

  return res.status(200).json({
    success: true,
    token,
    user: adminUser,
  })
}
