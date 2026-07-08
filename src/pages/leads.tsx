import { EntityManager, EntityField } from '@/components/entity-manager'
import { LeadImportDialog } from '@/components/lead-import-dialog'
import { Lead } from '@/types'

const fields: EntityField<Lead>[] = [
  { key: 'company', label: 'Company', required: true },
  { key: 'personName', label: 'Contact Person', required: true },
  { key: 'mobile', label: 'Mobile', required: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'source', label: 'Source', type: 'select', options: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'].map((value) => ({ label: value.replace(/_/g, ' '), value })) },
  { key: 'industry', label: 'Industry' },
  { key: 'requirement', label: 'Requirement' },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'].map((value) => ({ label: value, value })) },
  { key: 'status', label: 'Status', type: 'select', options: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((value) => ({ label: value, value })) },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'expectedValue', label: 'Expected Value', type: 'number' },
  { key: 'notes', label: 'Notes', list: false },
]

const defaults: Lead = {
  id: '',
  company: '',
  personName: '',
  mobile: '',
  whatsapp: '',
  email: '',
  gst: '',
  city: '',
  state: '',
  country: 'India',
  address: '',
  source: 'website',
  industry: '',
  requirement: '',
  products: [],
  priority: 'medium',
  status: 'new',
  assignedTo: '',
  expectedValue: 0,
  notes: '',
  attachments: [],
  tags: [],
  createdAt: '',
  updatedAt: '',
  createdBy: '',
}

export function Leads() {
  return (
    <EntityManager
      title="Leads"
      description="Manage your sales leads"
      endpoint="/leads"
      queryKey="leads"
      addLabel="Add Lead"
      fields={fields}
      defaults={defaults}
      searchKeys={['company', 'personName', 'mobile', 'email', 'status']}
      primaryKey="company"
      secondaryKey="personName"
      amountKey="expectedValue"
      importControl={<LeadImportDialog />}
    />
  )
}
