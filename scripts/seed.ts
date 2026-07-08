import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '../database')

async function seedDatabase() {
  // Create users.xlsx with sample admin user
  const usersWorkbook = new ExcelJS.Workbook()
  const usersSheet = usersWorkbook.addWorksheet('Sheet1')
  usersSheet.columns = [
    { header: 'id', key: 'id', width: 20 },
    { header: 'name', key: 'name', width: 20 },
    { header: 'email', key: 'email', width: 20 },
    { header: 'password', key: 'password', width: 20 },
    { header: 'role', key: 'role', width: 20 },
    { header: 'avatar', key: 'avatar', width: 20 },
    { header: 'mobile', key: 'mobile', width: 20 },
    { header: 'createdAt', key: 'createdAt', width: 20 },
    { header: 'updatedAt', key: 'updatedAt', width: 20 },
  ]

  const hashedPassword = await bcrypt.hash('admin123', 10)
  usersSheet.addRow({
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@nexxus.com',
    password: hashedPassword,
    role: 'admin',
    avatar: '',
    mobile: '+1 (555) 123-4567',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  await usersWorkbook.xlsx.writeFile(path.join(DB_PATH, 'users.xlsx'))
  console.log('Seeded users.xlsx')

  // Create empty sheets for other tables
  const tables = ['leads', 'customers', 'followups', 'tasks', 'products', 'quotations', 'activity']
  
  for (const table of tables) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')
    worksheet.columns = [{ header: 'id', key: 'id', width: 20 }]
    await workbook.xlsx.writeFile(path.join(DB_PATH, `${table}.xlsx`))
    console.log(`Created ${table}.xlsx`)
  }

  const settingsWorkbook = new ExcelJS.Workbook()
  const settingsSheet = settingsWorkbook.addWorksheet('Sheet1')
  settingsSheet.columns = [
    { header: 'id', key: 'id', width: 20 },
    { header: 'companyName', key: 'companyName', width: 24 },
    { header: 'logo', key: 'logo', width: 20 },
    { header: 'gst', key: 'gst', width: 20 },
    { header: 'address', key: 'address', width: 30 },
    { header: 'city', key: 'city', width: 20 },
    { header: 'state', key: 'state', width: 20 },
    { header: 'country', key: 'country', width: 20 },
    { header: 'email', key: 'email', width: 24 },
    { header: 'mobile', key: 'mobile', width: 20 },
    { header: 'website', key: 'website', width: 24 },
    { header: 'currency', key: 'currency', width: 12 },
    { header: 'taxRate', key: 'taxRate', width: 12 },
    { header: 'createdAt', key: 'createdAt', width: 24 },
    { header: 'updatedAt', key: 'updatedAt', width: 24 },
  ]
  settingsSheet.addRow({
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  await settingsWorkbook.xlsx.writeFile(path.join(DB_PATH, 'settings.xlsx'))
  console.log('Created settings.xlsx')
}

seedDatabase().catch(console.error)
