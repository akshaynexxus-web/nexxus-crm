import { EntityManager, EntityField } from '@/components/entity-manager'
import { Quotation } from '@/types'

const fields: EntityField<Quotation>[] = [
  { key: 'number', label: 'Number' },
  { key: 'customerName', label: 'Customer Name', required: true },
  { key: 'subtotal', label: 'Subtotal', type: 'number' },
  { key: 'tax', label: 'Tax', type: 'number' },
  { key: 'discount', label: 'Discount', type: 'number' },
  { key: 'total', label: 'Total', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'accepted', 'rejected'].map((value) => ({ label: value, value })) },
  { key: 'validUntil', label: 'Valid Until', type: 'date' },
  { key: 'terms', label: 'Terms', list: false },
]

const defaults: Quotation = {
  id: '',
  number: '',
  customerId: '',
  customerName: '',
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  terms: '',
  status: 'draft',
  validUntil: new Date().toISOString().slice(0, 10),
  createdAt: '',
  updatedAt: '',
  createdBy: '',
}

export function Quotations() {
  return (
    <EntityManager
      title="Quotations"
      description="Manage your quotations and proposals"
      endpoint="/quotations"
      queryKey="quotations"
      addLabel="Create Quotation"
      fields={fields}
      defaults={defaults}
      searchKeys={['number', 'customerName', 'status']}
      primaryKey="number"
      secondaryKey="customerName"
      amountKey="total"
    />
  )
}
