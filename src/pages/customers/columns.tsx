import { ColumnDef } from '@tanstack/react-table'
import { Customer } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'mobile',
    header: 'Mobile',
  },
  {
    accessorKey: 'city',
    header: 'City',
  },
  {
    accessorKey: 'outstanding',
    header: 'Outstanding',
    cell: ({ row }) => {
      const value = row.getValue('outstanding') as number
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