type ApiRequest = {
  method?: string
  body?: unknown
  query?: Record<string, unknown>
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

function sendMethodNotAllowed(res: ApiResponse, methods: string) {
  res.setHeader('Allow', methods)
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

function prepare(res: ApiResponse) {
  res.setHeader('Content-Type', 'application/json')
}

function getId(req: ApiRequest) {
  const value = req.query?.id
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function isEntityName(value: string): value is EntityName {
  return ['leads', 'customers', 'followups', 'tasks', 'quotations', 'products'].includes(value)
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

    return sendMethodNotAllowed(res, 'GET, POST, OPTIONS')
  }
}

export function recordHandler(entity: EntityName) {
  return function handler(req: ApiRequest, res: ApiResponse) {
    prepare(res)

    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS')
      return res.status(204).end()
    }

    const id = getId(req)
    const index = stores[entity].findIndex((record) => String(record.id) === id)

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Record not found' })
    }

    if (req.method === 'GET') {
      return res.status(200).json(stores[entity][index])
    }

    if (req.method === 'PUT') {
      const body = readBody(req.body)
      const updated = {
        ...stores[entity][index],
        ...(body as Record<string, any>),
        id,
        updatedAt: new Date().toISOString(),
      }
      stores[entity][index] = updated
      return res.status(200).json({ success: true, data: updated })
    }

    if (req.method === 'DELETE') {
      stores[entity] = stores[entity].filter((record) => String(record.id) !== id)
      return res.status(200).json({ success: true })
    }

    return sendMethodNotAllowed(res, 'GET, PUT, DELETE, OPTIONS')
  }
}

export function entityPathHandler(req: ApiRequest, res: ApiResponse) {
  const rawPath = req.query?.path
  const parts = (Array.isArray(rawPath) ? rawPath : [rawPath])
    .filter((part): part is string => typeof part === 'string' && part.length > 0)

  const entity = parts[0]
  const id = parts[1]

  if (!entity || !isEntityName(entity)) {
    prepare(res)
    return res.status(404).json({ success: false, error: 'API route not found' })
  }

  if (!id) {
    return collectionHandler(entity)(req, res)
  }

  return recordHandler(entity)(
    {
      ...req,
      query: {
        ...req.query,
        id,
      },
    },
    res
  )
}
