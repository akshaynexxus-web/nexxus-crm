import { Router } from 'express'
import XLSX from 'xlsx'
import { requireAdmin } from '../middleware/auth'

const router = Router()

const sheets: Record<string, Array<Record<string, any>>> = {
  Leads: [
    {
      company: 'Example Industries',
      personName: 'Rahul Sharma',
      mobile: '9876543210',
      whatsapp: '9876543210',
      email: 'rahul@example.com',
      gst: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      address: 'Office address',
      source: 'website',
      industry: 'manufacturing',
      requirement: 'Product requirement',
      products: 'Product A, Product B',
      priority: 'medium',
      status: 'new',
      assignedTo: 'Admin User',
      expectedValue: 50000,
      notes: 'Imported from Excel',
      tags: 'hot, website',
    },
  ],
  Customers: [
    {
      company: 'Example Customer Pvt Ltd',
      email: 'customer@example.com',
      mobile: '9876543210',
      gst: '',
      pan: '',
      address: 'Customer address',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      outstanding: 0,
    },
  ],
  FollowUps: [
    {
      title: 'Call customer',
      description: 'Discuss quotation',
      type: 'call',
      scheduledAt: '2026-07-10',
      status: 'scheduled',
      priority: 'medium',
      assignedTo: 'Admin User',
    },
  ],
  Tasks: [
    {
      title: 'Prepare quotation',
      description: 'Create quotation for customer',
      assignedTo: 'Admin User',
      dueDate: '2026-07-10',
      priority: 'medium',
      status: 'todo',
    },
  ],
  Products: [
    {
      name: 'Example Product',
      category: 'Category',
      price: 1000,
      gst: 18,
      sku: 'SKU-001',
      description: 'Product description',
      image: '',
    },
  ],
  Quotations: [
    {
      number: 'QUO-001',
      customerName: 'Example Customer Pvt Ltd',
      subtotal: 1000,
      tax: 180,
      discount: 0,
      total: 1180,
      status: 'draft',
      validUntil: '2026-07-31',
      terms: 'Payment due on receipt',
    },
  ],
  Users: [
    {
      name: 'Sales User',
      email: 'sales@example.com',
      password: 'change123',
      role: 'sales_executive',
      mobile: '9876543210',
      avatar: '',
    },
  ],
  Settings: [
    {
      companyName: 'Nexxus Group',
      logo: '',
      gst: '',
      address: 'Company address',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      email: 'contact@nexxus.com',
      mobile: '9876543210',
      website: '',
      currency: 'INR',
      taxRate: 18,
    },
  ],
}

router.get('/crm-workbook', requireAdmin, (req, res) => {
  const workbook = XLSX.utils.book_new()

  Object.entries(sheets).forEach(([name, rows]) => {
    const worksheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, name)
  })

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Disposition', 'attachment; filename="nexxus-crm-excel-template.xlsx"')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(buffer)
})

export { router as templateRoutes }
