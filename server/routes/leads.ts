import { Router } from 'express'
import multer from 'multer'
import XLSX from 'xlsx'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from '../middleware/auth'

const router = Router()
const db = new DatabaseService('leads.xlsx')
const upload = multer({ storage: multer.memoryStorage() })

const leadHeaders = [
  'company',
  'personName',
  'mobile',
  'whatsapp',
  'email',
  'gst',
  'city',
  'state',
  'country',
  'address',
  'source',
  'industry',
  'requirement',
  'products',
  'priority',
  'status',
  'assignedTo',
  'expectedValue',
  'notes',
  'tags',
]

const fieldAliases: Record<string, string[]> = {
  company: ['company', 'companyname', 'customer', 'customername', 'client', 'clientname', 'firm', 'businessname', 'organization', 'organisation'],
  personName: ['personname', 'contactperson', 'contactname', 'person', 'name', 'leadname', 'customerperson'],
  mobile: ['mobile', 'mobileno', 'mobilenumber', 'phone', 'phoneno', 'phonenumber', 'contactnumber', 'contactno', 'cell'],
  whatsapp: ['whatsapp', 'whatsappno', 'whatsappnumber'],
  email: ['email', 'emailid', 'mail', 'mailid'],
  gst: ['gst', 'gstin', 'gstnumber', 'gstno'],
  city: ['city', 'town'],
  state: ['state', 'province'],
  country: ['country'],
  address: ['address', 'location'],
  source: ['source', 'leadsource', 'enquirysource', 'inquirysource'],
  industry: ['industry', 'segment', 'businesscategory'],
  requirement: ['requirement', 'requirements', 'enquiry', 'inquiry', 'need', 'description'],
  products: ['products', 'product', 'items', 'item'],
  priority: ['priority'],
  status: ['status', 'leadstatus', 'stage'],
  assignedTo: ['assignedto', 'assignee', 'salesperson', 'salesexecutive', 'owner'],
  expectedValue: ['expectedvalue', 'value', 'amount', 'dealvalue', 'estimatedvalue', 'quotationvalue'],
  notes: ['notes', 'note', 'remarks', 'remark', 'comments'],
  tags: ['tags', 'tag'],
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function pickValue(row: Record<string, any>, key: string) {
  const aliases = fieldAliases[key] || [key]
  const normalizedKey = Object.keys(row).find((item) => aliases.includes(normalizeHeader(item)))
  return normalizedKey ? row[normalizedKey] : ''
}

function normalizeText(value: any) {
  return String(value || '').trim()
}

function leadKey(lead: Record<string, any>) {
  const email = normalizeText(lead.email).toLowerCase()
  if (email) return `email:${email}`

  const mobile = normalizeText(lead.mobile)
  if (mobile) return `mobile:${mobile}`

  return `company:${normalizeText(lead.company).toLowerCase()}|person:${normalizeText(lead.personName).toLowerCase()}`
}

function normalizeOption(value: any, allowed: string[], fallback: string) {
  const option = normalizeText(value).toLowerCase().replace(/\s+/g, '_')
  return allowed.includes(option) ? option : fallback
}

// Get all leads
router.get('/', async (req, res) => {
  try {
    await db.load()
    const leads = await db.getAll()
    res.json(leads)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Import leads from Excel
router.post('/import', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Excel file is required' })
    }

    await db.load()
    const workbook = XLSX.read(req.file.buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' })
    const duplicateMode = ['skip', 'update', 'create'].includes(String(req.body.duplicateMode))
      ? String(req.body.duplicateMode)
      : 'skip'
    const dryRun = String(req.body.dryRun || '').toLowerCase() === 'true'
    const now = new Date().toISOString()
    const existingLeads = await db.getAll()
    const existingByKey = new Map<string, any>()

    existingLeads.forEach((lead: any) => {
      existingByKey.set(leadKey(lead), lead)
    })

    let imported = 0
    let updated = 0
    let skipped = 0
    const errors: Array<{ row: number; reason: string }> = []
    const previews: any[] = []

    for (const [index, row] of rows.entries()) {
      const excelRow = index + 2
      const company = normalizeText(pickValue(row, 'company'))
      const personName = normalizeText(pickValue(row, 'personName'))
      const mobile = normalizeText(pickValue(row, 'mobile'))
      const email = normalizeText(pickValue(row, 'email'))

      if (!company) {
        errors.push({ row: excelRow, reason: 'Company is required' })
        skipped += 1
        continue
      }

      if (!personName && !mobile && !email) {
        errors.push({ row: excelRow, reason: 'Add contact person, mobile, or email' })
        skipped += 1
        continue
      }

      const lead = leadHeaders.reduce((result, key) => {
        result[key] = pickValue(row, key)
        return result
      }, {} as Record<string, any>)

      const normalizedLead = {
        id: uuidv4(),
        ...lead,
        company,
        personName,
        mobile,
        email,
        country: normalizeText(lead.country) || 'India',
        source: normalizeOption(lead.source, ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'], 'other'),
        priority: normalizeOption(lead.priority, ['low', 'medium', 'high', 'urgent'], 'medium'),
        status: normalizeOption(lead.status, ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], 'new'),
        expectedValue: Number(lead.expectedValue || 0),
        createdAt: now,
        updatedAt: now,
        createdBy: 'excel-import',
      }

      const key = leadKey(normalizedLead)
      const existing = existingByKey.get(key)

      if (existing && duplicateMode === 'skip') {
        skipped += 1
        previews.push({ row: excelRow, action: 'skipped_duplicate', company, personName, mobile, email })
        continue
      }

      if (existing && duplicateMode === 'update') {
        if (!dryRun) {
          await db.update(existing.id, {
            ...normalizedLead,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
          })
        }
        updated += 1
        previews.push({ row: excelRow, action: 'updated', company, personName, mobile, email })
        continue
      }

      if (!dryRun) {
        await db.create(normalizedLead)
      }
      existingByKey.set(key, normalizedLead)
      imported += 1
      previews.push({ row: excelRow, action: 'imported', company, personName, mobile, email })
    }

    res.json({
      success: true,
      dryRun,
      totalRows: rows.length,
      imported,
      updated,
      skipped,
      errors,
      previews: previews.slice(0, 25),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    await db.load()
    const lead = await db.getById(req.params.id)
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' })
    }
    res.json(lead)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create lead
router.post('/', async (req, res) => {
  try {
    await db.load()
    const lead = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.create(lead)
    res.json({ success: true, data: lead })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update lead
router.put('/:id', async (req, res) => {
  try {
    await db.load()
    const lead = await db.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    })
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' })
    }
    res.json({ success: true, data: lead })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    await db.load()
    const deleted = await db.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Lead not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as leadRoutes }
