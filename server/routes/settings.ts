import { Router } from 'express'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '../../database')
const SETTINGS_FILE = path.join(DB_PATH, 'settings.xlsx')

const settingsHeaders = [
  'id',
  'companyName',
  'logo',
  'gst',
  'address',
  'city',
  'state',
  'country',
  'email',
  'mobile',
  'website',
  'currency',
  'taxRate',
  'createdAt',
  'updatedAt',
]

const defaultSettings = {
  id: 'company-settings',
  companyName: 'Nexxus Group',
  logo: '',
  gst: '',
  address: '',
  city: '',
  state: '',
  country: '',
  email: 'contact@nexxus.com',
  mobile: '',
  website: '',
  currency: 'INR',
  taxRate: 18,
}

type SettingsData = typeof defaultSettings & {
  createdAt?: string
  updatedAt?: string
}

function rowToSettings(row: ExcelJS.Row): SettingsData {
  return settingsHeaders.reduce((settings, header, index) => {
    const value = row.getCell(index + 1).value
    return {
      ...settings,
      [header]: value ?? defaultSettings[header as keyof typeof defaultSettings] ?? '',
    }
  }, {} as SettingsData)
}

function settingsToValues(settings: SettingsData) {
  return settingsHeaders.map((header) => settings[header as keyof SettingsData] ?? '')
}

async function loadSettingsWorkbook() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true })
  }

  const workbook = new ExcelJS.Workbook()

  if (fs.existsSync(SETTINGS_FILE)) {
    await workbook.xlsx.readFile(SETTINGS_FILE)
  }

  let worksheet = workbook.getWorksheet(1)
  if (!worksheet) {
    worksheet = workbook.addWorksheet('Sheet1')
  }

  const existingHeaders = settingsHeaders.map((_, index) => String(worksheet.getRow(1).getCell(index + 1).value ?? ''))
  const needsHeaderRepair = settingsHeaders.some((header, index) => existingHeaders[index] !== header)

  if (needsHeaderRepair) {
    worksheet.spliceRows(1, worksheet.rowCount)
    worksheet.addRow(settingsHeaders)
    worksheet.addRow(settingsToValues({
      ...defaultSettings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    await workbook.xlsx.writeFile(SETTINGS_FILE)
  } else if (worksheet.rowCount < 2) {
    worksheet.addRow(settingsToValues({
      ...defaultSettings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    await workbook.xlsx.writeFile(SETTINGS_FILE)
  }

  return { workbook, worksheet }
}

router.get('/', async (req, res) => {
  try {
    const { worksheet } = await loadSettingsWorkbook()
    res.json({ success: true, data: rowToSettings(worksheet.getRow(2)) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.put('/', async (req, res) => {
  try {
    const { workbook, worksheet } = await loadSettingsWorkbook()
    const current = rowToSettings(worksheet.getRow(2))
    const now = new Date().toISOString()
    const nextSettings = {
      ...current,
      ...req.body,
      id: current.id || defaultSettings.id,
      taxRate: Number(req.body.taxRate ?? current.taxRate ?? defaultSettings.taxRate),
      createdAt: current.createdAt || now,
      updatedAt: now,
    }

    worksheet.getRow(2).values = settingsToValues(nextSettings)
    await workbook.xlsx.writeFile(SETTINGS_FILE)

    res.json({ success: true, data: nextSettings })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as settingRoutes }
