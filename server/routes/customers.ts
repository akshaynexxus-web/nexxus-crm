import { Router } from 'express'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const db = new DatabaseService('customers.xlsx')

// Get all customers
router.get('/', async (req, res) => {
  try {
    await db.load()
    const customers = await db.getAll()
    res.json(customers)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    await db.load()
    const customer = await db.getById(req.params.id)
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }
    res.json(customer)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create customer
router.post('/', async (req, res) => {
  try {
    await db.load()
    const customer = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.create(customer)
    res.json({ success: true, data: customer })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update customer
router.put('/:id', async (req, res) => {
  try {
    await db.load()
    const customer = await db.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    })
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }
    res.json({ success: true, data: customer })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    await db.load()
    const deleted = await db.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as customerRoutes }
