import { Router } from 'express'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const db = new DatabaseService('products.xlsx')

// Get all products
router.get('/', async (req, res) => {
  try {
    await db.load()
    const products = await db.getAll()
    res.json(products)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    await db.load()
    const product = await db.getById(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create product
router.post('/', async (req, res) => {
  try {
    await db.load()
    const product = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.create(product)
    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update product
router.put('/:id', async (req, res) => {
  try {
    await db.load()
    const product = await db.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    })
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await db.load()
    const deleted = await db.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as productRoutes }
