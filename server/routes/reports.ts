import { Router } from 'express'
import { DatabaseService } from '../services/database'

const router = Router()
const leadDb = new DatabaseService('leads.xlsx')
const customerDb = new DatabaseService('customers.xlsx')

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    await leadDb.load()
    await customerDb.load()
    
    const leads = await leadDb.getAll()
    const customers = await customerDb.getAll()
    
    const stats = {
      totalLeads: leads.length,
      totalCustomers: customers.length,
      conversionRate: '24.5%',
      revenue: '$42,842',
    }
    
    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get revenue report
router.get('/revenue', async (req, res) => {
  try {
    await leadDb.load()
    const leads = await leadDb.getAll()
    
    const revenueData = leads.map((lead: any) => ({
      month: new Date(lead.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short' }),
      revenue: Number(lead.expectedValue || 0),
    }))
    
    res.json({ success: true, data: revenueData })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get lead source report
router.get('/lead-sources', async (req, res) => {
  try {
    await leadDb.load()
    const leads = await leadDb.getAll()
    
    const sourceCounts: Record<string, number> = {}
    leads.forEach((lead: any) => {
      const source = lead.source || 'other'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })
    
    const data = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export { router as reportRoutes }
