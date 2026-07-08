import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = process.env.DATA_DIR || (
  process.env.VERCEL === '1'
    ? path.join('/tmp', 'nexxus-crm-database')
    : path.join(__dirname, '../../database')
)
const KV_REST_API_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const USE_KV_STORAGE = Boolean(KV_REST_API_URL && KV_REST_API_TOKEN)

const TABLE_HEADERS: Record<string, string[]> = {
  'users.xlsx': ['id', 'name', 'email', 'password', 'role', 'avatar', 'mobile', 'createdAt', 'updatedAt'],
  'leads.xlsx': ['id', 'company', 'personName', 'mobile', 'whatsapp', 'email', 'gst', 'city', 'state', 'country', 'address', 'source', 'industry', 'requirement', 'products', 'priority', 'status', 'assignedTo', 'expectedValue', 'notes', 'attachments', 'tags', 'createdAt', 'updatedAt', 'createdBy'],
  'customers.xlsx': ['id', 'company', 'gst', 'pan', 'address', 'city', 'state', 'country', 'contactPersons', 'locations', 'purchaseHistory', 'outstanding', 'files', 'createdAt', 'updatedAt', 'email', 'mobile'],
  'followups.xlsx': ['id', 'leadId', 'customerId', 'title', 'description', 'type', 'scheduledAt', 'completedAt', 'status', 'priority', 'assignedTo', 'reminder', 'color', 'createdAt', 'updatedAt'],
  'tasks.xlsx': ['id', 'title', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'reminder', 'recurring', 'recurringType', 'completedAt', 'createdAt', 'updatedAt'],
  'products.xlsx': ['id', 'name', 'category', 'price', 'gst', 'description', 'image', 'sku', 'createdAt', 'updatedAt'],
  'quotations.xlsx': ['id', 'number', 'customerId', 'customerName', 'items', 'subtotal', 'tax', 'discount', 'total', 'terms', 'status', 'validUntil', 'createdAt', 'updatedAt', 'createdBy'],
  'settings.xlsx': ['id', 'companyName', 'logo', 'gst', 'address', 'city', 'state', 'country', 'email', 'mobile', 'website', 'currency', 'taxRate', 'createdAt', 'updatedAt'],
  'activity.xlsx': ['id', 'userId', 'action', 'module', 'recordId', 'details', 'timestamp'],
}

// Ensure database directory exists for local file storage.
if (!USE_KV_STORAGE && !fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true })
}

// Create workbook helper
async function createWorkbook(filename: string, headers: string[]) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')
  
  worksheet.columns = headers.map(header => ({ header, key: header, width: 20 }))
  
  await workbook.xlsx.writeFile(path.join(DB_PATH, filename))
  return workbook
}

// Initialize all database files
export async function initializeDatabase() {
  if (USE_KV_STORAGE) {
    return
  }

  const files = [
    { name: 'users.xlsx', headers: ['id', 'name', 'email', 'password', 'role', 'avatar', 'mobile', 'createdAt', 'updatedAt'] },
    { name: 'leads.xlsx', headers: ['id', 'company', 'personName', 'mobile', 'whatsapp', 'email', 'gst', 'city', 'state', 'country', 'address', 'source', 'industry', 'requirement', 'products', 'priority', 'status', 'assignedTo', 'expectedValue', 'notes', 'attachments', 'tags', 'createdAt', 'updatedAt', 'createdBy'] },
    { name: 'customers.xlsx', headers: ['id', 'company', 'gst', 'pan', 'address', 'city', 'state', 'country', 'contactPersons', 'locations', 'purchaseHistory', 'outstanding', 'files', 'createdAt', 'updatedAt', 'email', 'mobile'] },
    { name: 'followups.xlsx', headers: ['id', 'leadId', 'customerId', 'title', 'description', 'type', 'scheduledAt', 'completedAt', 'status', 'priority', 'assignedTo', 'reminder', 'color', 'createdAt', 'updatedAt'] },
    { name: 'tasks.xlsx', headers: ['id', 'title', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'reminder', 'recurring', 'recurringType', 'completedAt', 'createdAt', 'updatedAt'] },
    { name: 'products.xlsx', headers: ['id', 'name', 'category', 'price', 'gst', 'description', 'image', 'sku', 'createdAt', 'updatedAt'] },
    { name: 'quotations.xlsx', headers: ['id', 'number', 'customerId', 'customerName', 'items', 'subtotal', 'tax', 'discount', 'total', 'terms', 'status', 'validUntil', 'createdAt', 'updatedAt', 'createdBy'] },
    { name: 'settings.xlsx', headers: ['id', 'companyName', 'logo', 'gst', 'address', 'city', 'state', 'country', 'email', 'mobile', 'website', 'currency', 'taxRate', 'createdAt', 'updatedAt'] },
    { name: 'activity.xlsx', headers: ['id', 'userId', 'action', 'module', 'recordId', 'details', 'timestamp'] },
  ]

  for (const file of files) {
    const filePath = path.join(DB_PATH, file.name)
    if (!fs.existsSync(filePath)) {
      await createWorkbook(file.name, file.headers)
      console.log(`Created ${file.name}`)
    }
  }
}

// Generic database operations
export class DatabaseService {
  private workbook: ExcelJS.Workbook
  private worksheet!: ExcelJS.Worksheet
  private headers: string[] = []
  private jsonRows: Record<string, any>[] = []
  private storageMode: 'excel' | 'json' | 'kv' = USE_KV_STORAGE ? 'kv' : 'excel'

  constructor(private filename: string) {
    this.workbook = new ExcelJS.Workbook()
  }

  async load() {
    const expectedHeaders = TABLE_HEADERS[this.filename] || []
    if (USE_KV_STORAGE) {
      this.storageMode = 'kv'
      this.headers = expectedHeaders
      await this.loadKvRows()
      return
    }

    const fallbackPath = this.getJsonFallbackPath()
    if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).size > 2) {
      this.storageMode = 'json'
      this.headers = expectedHeaders
      await this.loadJsonFallback()
      return
    }

    try {
      this.storageMode = 'excel'
      await this.workbook.xlsx.readFile(path.join(DB_PATH, this.filename))
      this.worksheet = this.workbook.getWorksheet(1)!
      await this.ensureHeaders()
      this.headers = this.worksheet.getRow(1).values as string[]
      this.headers = this.headers.slice(1).map(String)
    } catch (error: any) {
      this.storageMode = 'json'
      this.headers = expectedHeaders
      await this.loadJsonFallback()
    }
  }

  async save() {
    if (this.storageMode === 'kv') {
      await this.saveKvRows()
      return
    }

    if (this.storageMode === 'json') {
      await this.saveJsonFallback()
      return
    }

    try {
      await this.workbook.xlsx.writeFile(path.join(DB_PATH, this.filename))
    } catch (error: any) {
      if (error?.code !== 'EBUSY') throw error
      this.storageMode = 'json'
      if (this.headers.length > 0) {
        this.jsonRows = await this.extractExistingRows(this.headers)
      } else {
        await this.loadJsonFallback()
      }
      await this.saveJsonFallback()
    }
  }

  async getAll(): Promise<any[]> {
    if (this.storageMode === 'kv') {
      return this.jsonRows
    }

    if (this.storageMode === 'json') {
      return this.jsonRows
    }

    const rows: any[] = []
    this.worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        rows.push(this.rowToObject(row))
      }
    })
    return rows
  }

  async getById(id: string): Promise<any | null> {
    if (this.storageMode === 'kv') {
      return this.jsonRows.find((row) => row.id === id) || null
    }

    if (this.storageMode === 'json') {
      return this.jsonRows.find((row) => row.id === id) || null
    }

    let found: any = null
    this.worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).value === id) {
        found = this.rowToObject(row)
      }
    })
    return found
  }

  async create(data: any): Promise<any> {
    if (this.storageMode === 'kv') {
      const row = this.normalizeObject(data)
      this.jsonRows.push(row)
      await this.save()
      return row
    }

    if (this.storageMode === 'json') {
      const row = this.normalizeObject(data)
      this.jsonRows.push(row)
      await this.save()
      return row
    }

    const values = Array.isArray(data) ? data : this.objectToValues(data)
    const newRow = this.worksheet.addRow(values)
    const created = this.rowToObject(newRow)
    await this.save()
    if (this.storageMode === 'json' && !this.jsonRows.some((row) => row.id === created.id)) {
      this.jsonRows.push(created)
      await this.saveJsonFallback()
    }
    return created
  }

  async update(id: string, data: any): Promise<any | null> {
    if (this.storageMode === 'kv') {
      const index = this.jsonRows.findIndex((row) => row.id === id)
      if (index === -1) return null
      this.jsonRows[index] = this.normalizeObject({ ...this.jsonRows[index], ...data, id })
      await this.save()
      return this.jsonRows[index]
    }

    if (this.storageMode === 'json') {
      const index = this.jsonRows.findIndex((row) => row.id === id)
      if (index === -1) return null
      this.jsonRows[index] = this.normalizeObject({ ...this.jsonRows[index], ...data, id })
      await this.save()
      return this.jsonRows[index]
    }

    let updated: any = null
    this.worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).value === id) {
        const current = this.rowToObject(row)
        row.values = this.objectToValues({ ...current, ...data, id })
        updated = this.rowToObject(row)
      }
    })
    if (updated) {
      await this.save()
    }
    return updated
  }

  async delete(id: string): Promise<boolean> {
    if (this.storageMode === 'kv') {
      const initialCount = this.jsonRows.length
      this.jsonRows = this.jsonRows.filter((row) => row.id !== id)
      const deleted = this.jsonRows.length !== initialCount
      if (deleted) await this.save()
      return deleted
    }

    if (this.storageMode === 'json') {
      const initialCount = this.jsonRows.length
      this.jsonRows = this.jsonRows.filter((row) => row.id !== id)
      const deleted = this.jsonRows.length !== initialCount
      if (deleted) await this.save()
      return deleted
    }

    let deleted = false
    let rowToDelete = 0
    this.worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).value === id) {
        rowToDelete = rowNumber
        deleted = true
      }
    })
    if (deleted) {
      this.worksheet.spliceRows(rowToDelete, 1)
      await this.save()
    }
    return deleted
  }

  private rowToObject(row: ExcelJS.Row): Record<string, any> {
    return this.headers.reduce((result, header, index) => {
      const value = row.getCell(index + 1).value
      result[header] = value ?? ''
      return result
    }, {} as Record<string, any>)
  }

  private objectToValues(data: Record<string, any>): any[] {
    return this.headers.map((header) => {
      const value = data[header]
      if (Array.isArray(value) || (value && typeof value === 'object' && !(value instanceof Date))) {
        return JSON.stringify(value)
      }
      return value ?? ''
    })
  }

  private normalizeObject(data: Record<string, any>) {
    if (this.headers.length === 0) return data
    return this.headers.reduce((row, header) => {
      row[header] = data[header] ?? ''
      return row
    }, {} as Record<string, any>)
  }

  private getJsonFallbackPath() {
    const jsonPath = path.join(DB_PATH, 'json')
    if (!fs.existsSync(jsonPath)) {
      fs.mkdirSync(jsonPath, { recursive: true })
    }
    return path.join(jsonPath, this.filename.replace(/\.xlsx$/, '.json'))
  }

  private async loadJsonFallback() {
    const fallbackPath = this.getJsonFallbackPath()
    if (!fs.existsSync(fallbackPath)) {
      this.jsonRows = []
      await this.saveJsonFallback()
      return
    }

    this.jsonRows = JSON.parse(await fs.promises.readFile(fallbackPath, 'utf8'))
  }

  private async saveJsonFallback() {
    await fs.promises.writeFile(this.getJsonFallbackPath(), JSON.stringify(this.jsonRows, null, 2))
  }

  private getKvKey() {
    return `nexxus-crm:${this.filename.replace(/\.xlsx$/, '')}`
  }

  private async kvCommand<T>(command: unknown[]): Promise<T> {
    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
      throw new Error('KV storage is not configured')
    }

    const response = await fetch(KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })

    if (!response.ok) {
      throw new Error(`KV request failed: ${response.status} ${response.statusText}`)
    }

    const payload = await response.json()
    return payload.result as T
  }

  private async loadKvRows() {
    const stored = await this.kvCommand<string | null>(['GET', this.getKvKey()])
    if (!stored) {
      this.jsonRows = []
      await this.saveKvRows()
      return
    }

    this.jsonRows = JSON.parse(stored)
  }

  private async saveKvRows() {
    await this.kvCommand(['SET', this.getKvKey(), JSON.stringify(this.jsonRows)])
  }

  private async ensureHeaders() {
    const expectedHeaders = TABLE_HEADERS[this.filename]
    if (!expectedHeaders) return

    const currentHeaders = (this.worksheet.getRow(1).values as any[])
      .slice(1)
      .map((value) => String(value ?? ''))

    const missingHeaders = expectedHeaders.filter((header) => !currentHeaders.includes(header))
    if (missingHeaders.length === 0) return

    const rows = await this.extractExistingRows(currentHeaders)
    this.worksheet.spliceRows(1, this.worksheet.rowCount)
    this.worksheet.addRow(expectedHeaders)

    rows.forEach((row) => {
      this.worksheet.addRow(expectedHeaders.map((header) => row[header] ?? ''))
    })

    await this.save()
  }

  private async extractExistingRows(currentHeaders: string[]) {
    const rows: Record<string, any>[] = []
    this.worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return
      const item: Record<string, any> = {}
      currentHeaders.forEach((header, index) => {
        if (header) item[header] = row.getCell(index + 1).value ?? ''
      })
      rows.push(item)
    })
    return rows
  }
}
