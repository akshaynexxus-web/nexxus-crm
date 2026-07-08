import { ColumnDef } from '@tanstack/react-table'
import { Lead } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'personName',
    header: 'Contact Person',
  },
  {
    accessorKey: 'mobile',
    header: 'Mobile',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'new' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      return (
        <Badge
          variant={
            priority === 'urgent'
              ? 'destructive'
              : priority === 'high'
              ? 'default'
              : 'secondary'
          }
        >
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'expectedValue',
    header: 'Expected Value',
    cell: ({ row }) => {
      const value = row.getValue('expectedValue') as number
      return <div>${value.toLocaleString()}</div>
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]