import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '../database')
const BACKUP_PATH = path.join(__dirname, '../backups')

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true })
}

// Create backup
const date = new Date().toISOString().split('T')[0]
const backupDir = path.join(BACKUP_PATH, `backup-${date}`)

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// Copy all database files
const files = ['users.xlsx', 'leads.xlsx', 'customers.xlsx', 'followups.xlsx', 'tasks.xlsx', 'products.xlsx', 'quotations.xlsx', 'settings.xlsx', 'activity.xlsx']

files.forEach(file => {
  const source = path.join(DB_PATH, file)
  const dest = path.join(backupDir, file)
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest)
    console.log(`Backed up ${file}`)
  }
})

console.log(`Backup completed: ${backupDir}`)