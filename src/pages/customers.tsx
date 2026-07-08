import { EntityManager, EntityField } from '@/components/entity-manager'
import { Customer } from '@/types'

type CustomerForm = Customer & { email: string; mobile: string }

const fields: EntityField<CustomerForm>[] = [
  { key: 'company', label: 'Company', required: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'gst', label: 'GST' },
  { key: 'pan', label: 'PAN' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'outstanding', label: 'Outstanding', type: 'number' },
]

const defaults: CustomerForm = {
  id: '',
  company: '',
  email: '',
  mobile: '',
  gst: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  contactPersons: [],
  locations: [],
  purchaseHistory: [],
  outstanding: 0,
  files: [],
  createdAt: '',
  updatedAt: '',
}

export function Customers() {
  return (
    <EntityManager
      title="Customers"
      description="Manage your customer database"
      endpoint="/customers"
      queryKey="customers"
      addLabel="Add Customer"
      fields={fields}
      defaults={defaults}
      searchKeys={['company', 'email', 'mobile', 'city']}
      primaryKey="company"
      secondaryKey="email"
      amountKey="outstanding"
    />
  )
}
