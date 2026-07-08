import { EntityManager, EntityField } from '@/components/entity-manager'
import { Task } from '@/types'

const fields: EntityField<Task>[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'dueDate', label: 'Due Date', type: 'date' },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'].map((value) => ({ label: value, value })) },
  { key: 'status', label: 'Status', type: 'select', options: ['todo', 'in_progress', 'completed', 'cancelled'].map((value) => ({ label: value.replace(/_/g, ' '), value })) },
]

const defaults: Task = {
  id: '',
  title: '',
  description: '',
  assignedTo: '',
  dueDate: new Date().toISOString().slice(0, 10),
  priority: 'medium',
  status: 'todo',
  reminder: false,
  recurring: false,
  recurringType: 'daily',
  completedAt: '',
  createdAt: '',
  updatedAt: '',
}

export function Tasks() {
  return (
    <EntityManager
      title="Tasks"
      description="Manage your tasks and to-dos"
      endpoint="/tasks"
      queryKey="tasks"
      addLabel="Add Task"
      fields={fields}
      defaults={defaults}
      searchKeys={['title', 'description', 'assignedTo', 'status']}
      primaryKey="title"
      secondaryKey="assignedTo"
    />
  )
}
