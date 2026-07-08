import { Router } from 'express'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const db = new DatabaseService('quotations.xlsx')

// Get all quotations
router.get('/', async (req, res) => {
  try {
    await db.load()
    const quotations = await db.getAll()
    res.json(quotations)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get quotation by ID
router.get('/:id', async (req, res) => {
  try {
    await db.load()
    const quotation = await db.getById(req.params.id)
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' })
    }
    res.json(quotation)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create quotation
router.post('/', async (req, res) => {
  try {
    await db.load()
    const quotation = {
      id: uuidv4(),
      number: `QUO-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.create(quotation)
    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    await db.load()
    const quotation = await db.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    })
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' })
    }
    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    await db.load()
    const deleted = await db.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Quotation not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as quotationRoutes }
