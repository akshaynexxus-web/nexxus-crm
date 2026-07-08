import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authRoutes } from './routes/auth'
import { leadRoutes } from './routes/leads'
import { customerRoutes } from './routes/customers'
import { followupRoutes } from './routes/followups'
import { taskRoutes } from './routes/tasks'
import { productRoutes } from './routes/products'
import { quotationRoutes } from './routes/quotations'
import { reportRoutes } from './routes/reports'
import { settingRoutes } from './routes/settings'
import { templateRoutes } from './routes/templates'
import { initializeDatabase } from './services/database'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLIENT_DIST = path.join(__dirname, '../dist')

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    const isVercelPreview = origin?.endsWith('.vercel.app')
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(morgan('dev'))

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    cwd: process.cwd(),
    version: 'working-crm-2026-07-07',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/followups', followupRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/products', productRoutes)
app.use('/api/quotations', quotationRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/templates', templateRoutes)

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

// Initialize database
initializeDatabase()

if (process.env.VERCEL !== '1') {
  app.listen(Number(PORT), HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`)
  })
}

export default app
