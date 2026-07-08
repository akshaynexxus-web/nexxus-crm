import { Router } from 'express'
import { DatabaseService } from '../services/database'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const db = new DatabaseService('tasks.xlsx')

// Get all tasks
router.get('/', async (req, res) => {
  try {
    await db.load()
    const tasks = await db.getAll()
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    await db.load()
    const task = await db.getById(req.params.id)
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    res.json(task)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Create task
router.post('/', async (req, res) => {
  try {
    await db.load()
    const task = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.create(task)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Update task
router.put('/:id', async (req, res) => {
  try {
    await db.load()
    const task = await db.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    })
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    await db.load()
    const deleted = await db.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as taskRoutes }
