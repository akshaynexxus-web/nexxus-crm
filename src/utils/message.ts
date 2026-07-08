export function toDisplayMessage(value: unknown, fallback = 'Something went wrong') {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message || fallback
  if (!value) return fallback

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const code = typeof record.code === 'string' ? record.code : ''
    const message = typeof record.message === 'string' ? record.message : ''

    if (code && message) return `${code}: ${message}`
    if (message) return message

    try {
      return JSON.stringify(value)
    } catch {
      return fallback
    }
  }

  return String(value)
}
