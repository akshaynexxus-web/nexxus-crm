import { adminUser, createToken, readBody, sanitizeUser } from '../_auth-store'

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { email, password } = readBody(req.body)
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (normalizedEmail !== adminUser.email || String(password || '') !== adminUser.password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  }

  return res.status(200).json({
    success: true,
    token: createToken(adminUser),
    user: sanitizeUser(adminUser),
  })
}
