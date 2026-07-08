import { EntityManager, EntityField } from '@/components/entity-manager'
import { FollowUp } from '@/types'

const fields: EntityField<FollowUp>[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', type: 'select', options: ['call', 'email', 'meeting', 'whatsapp', 'visit'].map((value) => ({ label: value, value })) },
  { key: 'scheduledAt', label: 'Scheduled Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'missed', 'cancelled'].map((value) => ({ label: value, value })) },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'].map((value) => ({ label: value, value })) },
  { key: 'assignedTo', label: 'Assigned To' },
]

const defaults: FollowUp = {
  id: '',
  leadId: '',
  customerId: '',
  title: '',
  description: '',
  type: 'call',
  scheduledAt: new Date().toISOString().slice(0, 10),
  completedAt: '',
  status: 'scheduled',
  priority: 'medium',
  assignedTo: '',
  reminder: true,
  color: '',
  createdAt: '',
  updatedAt: '',
}

export function FollowUps() {
  return (
    <EntityManager
      title="Follow-ups"
      description="Manage your follow-up schedule"
      endpoint="/followups"
      queryKey="followups"
      addLabel="Schedule Follow-up"
      fields={fields}
      defaults={defaults}
      searchKeys={['title', 'description', 'type', 'status', 'assignedTo']}
      primaryKey="title"
      secondaryKey="scheduledAt"
    />
  )
}
