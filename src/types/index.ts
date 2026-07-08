export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'sales_executive'
  avatar?: string
  mobile?: string
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  company: string
  personName: string
  mobile: string
  whatsapp?: string
  email: string
  gst?: string
  city: string
  state: string
  country: string
  address?: string
  source: string
  industry: string
  requirement: string
  products: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  assignedTo: string
  expectedValue: number
  notes?: string
  attachments?: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface Customer {
  id: string
  company: string
  gst?: string
  pan?: string
  address: string
  city: string
  state: string
  country: string
  contactPersons: ContactPerson[]
  locations?: Location[]
  purchaseHistory?: Purchase[]
  outstanding: number
  files?: string[]
  createdAt: string
  updatedAt: string
}

export interface ContactPerson {
  id: string
  name: string
  email: string
  mobile: string
  position?: string
}

export interface Location {
  id: string
  address: string
  city: string
  state: string
  country: string
}

export interface Purchase {
  id: string
  date: string
  amount: number
  items: string[]
  invoiceId?: string
}

export interface FollowUp {
  id: string
  leadId?: string
  customerId?: string
  title: string
  description: string
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'visit'
  scheduledAt: string
  completedAt?: string
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assignedTo: string
  reminder?: boolean
  color?: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  dueDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  reminder?: boolean
  recurring?: boolean
  recurringType?: 'daily' | 'weekly' | 'monthly'
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  gst: number
  description: string
  image?: string
  sku?: string
  createdAt: string
  updatedAt: string
}

export interface Quotation {
  id: string
  number: string
  customerId: string
  customerName: string
  items: QuotationItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  terms?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  validUntil: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface QuotationItem {
  productId: string
  productName: string
  quantity: number
  price: number
  gst: number
  total: number
}

export interface Setting {
  id: string
  companyName: string
  logo?: string
  gst?: string
  address: string
  city: string
  state: string
  country: string
  email: string
  mobile: string
  website?: string
  currency: string
  taxRate: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  userId: string
  action: string
  module: string
  recordId: string
  details: string
  timestamp: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  isLoading: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export type LeadSource = 'website' | 'referral' | 'social_media' | 'email_campaign' | 'cold_call' | 'event' | 'other'
export type Industry = 'technology' | 'manufacturing' | 'healthcare' | 'finance' | 'retail' | 'construction' | 'education' | 'other'