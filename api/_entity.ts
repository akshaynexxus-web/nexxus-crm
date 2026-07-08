type ApiRequest = {
  method?: string
  body?: unknown
}

type ApiResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  end: () => void
}

type EntityName = 'leads' | 'customers' | 'followups' | 'tasks' | 'quotations' | 'products'
type Store = Record<EntityName, Array<Record<string, any>>>

declare global {
  var __nexxusEntityStore: Store | undefined
}

const stores: Store = globalThis.__nexxusEntityStore ?? {
  leads: [],
  customers: [],
  followups: [],
  tasks: [],
  quotations: [],
  products: [],
}

globalThis.__nexxusEntityStore = stores

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
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function prepare(res: ApiResponse) {
  res.setHeader('Content-Type', 'application/json')
}

export function collectionHandler(entity: EntityName) {
  return function handler(req: ApiRequest, res: ApiResponse) {
    prepare(res)

    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', 'GET, POST, OPTIONS')
      return res.status(204).end()
    }

    if (req.method === 'GET') {
      return res.status(200).json(stores[entity])
    }

    if (req.method === 'POST') {
      const now = new Date().toISOString()
      const body = readBody(req.body)
      const record = {
        id: createId(),
        ...(body as Record<string, any>),
        createdAt: now,
        updatedAt: now,
      }

      stores[entity] = [record, ...stores[entity]]
      return res.status(200).json({ success: true, data: record })
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
}

export default function handler(_req: ApiRequest, res: ApiResponse) {
  prepare(res)
  return res.status(404).json({ success: false, error: 'API helper route' })
}
