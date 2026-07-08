import { Router } from 'express'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const db = new DatabaseService('followups.xlsx')

// Get all followups
router.get('/', async (req, res) => {
  try {
    await db.load()
    const followups = await db.getAll()
    res.json(followups)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get followup by ID
router.get('/:id', async (req, res) => {
  try {
    await db.load()
    const followup = await db.getById(req.params.id)
    if (!followup) {
      return res.status(404).json({ success: false, error: 'Followup not found' })
    }
    res.json(followup)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create followup
router.post('/', async (req, res) => {
  try {
    await db.load()
    const followup = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.create(followup)
    res.json({ success: true, data: followup })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update followup
router.put('/:id', async (req, res) => {
  try {
    await db.load()
    const followup = await db.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    })
    if (!followup) {
      return res.status(404).json({ success: false, error: 'Followup not found' })
    }
    res.json({ success: true, data: followup })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete followup
router.delete('/:id', async (req, res) => {
  try {
    await db.load()
    const deleted = await db.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Followup not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as followupRoutes }
