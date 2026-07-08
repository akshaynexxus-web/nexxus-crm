const records: Array<Record<string, any>> = []

function readBody(body: unknown) {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return body && typeof body === 'object' ? body : {}
}

function createId() {
  return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(204).end()
  }

  if (req.method === 'GET') return res.status(200).json(records)

  if (req.method === 'POST') {
    const now = new Date().toISOString()
    const record = { id: createId(), ...(readBody(req.body) as Record<string, any>), createdAt: now, updatedAt: now }
    records.unshift(record)
    return res.status(200).json({ success: true, data: record })
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS')
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
