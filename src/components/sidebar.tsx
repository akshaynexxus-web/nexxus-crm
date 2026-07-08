import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  CheckSquare,
  BarChart3,
  FileText,
  Package,
  Settings,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Follow-ups', href: '/followups', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Pipeline', href: '/pipeline', icon: BarChart3 },
  { name: 'Quotations', href: '/quotations', icon: FileText },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: Shield, adminOnly: true },
]

export function Sidebar() {
  const { user } = useAuth()
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || user?.role === 'admin')

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          N
        </div>
        <span className="font-semibold text-lg">Nexxus CRM</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
