import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Calendar, CheckSquare, TrendingUp, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Customer, FollowUp, Lead, Quotation, Task } from '@/types'

const monthName = (date: string) =>
  new Date(date || Date.now()).toLocaleDateString('en-US', { month: 'short' })

export function Dashboard() {
  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ['leads'], queryFn: async () => (await api.get('/leads')).data })
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ['customers'], queryFn: async () => (await api.get('/customers')).data })
  const { data: followups = [] } = useQuery<FollowUp[]>({ queryKey: ['followups'], queryFn: async () => (await api.get('/followups')).data })
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: async () => (await api.get('/tasks')).data })
  const { data: quotations = [] } = useQuery<Quotation[]>({ queryKey: ['quotations'], queryFn: async () => (await api.get('/quotations')).data })

  const today = new Date().toISOString().slice(0, 10)
  const wonLeads = leads.filter((lead) => lead.status === 'won').length
  const totalRevenue = quotations.reduce((sum, quote) => sum + Number(quote.total || 0), 0)
  const conversionRate = leads.length ? `${Math.round((wonLeads / leads.length) * 100)}%` : '0%'
  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const todayFollowups = followups.filter((followup) => String(followup.scheduledAt || '').slice(0, 10) === today).length

  const stats = [
    { title: 'Total Leads', value: leads.length, icon: UserPlus, color: 'text-blue-500' },
    { title: 'Total Customers', value: customers.length, icon: Users, color: 'text-green-500' },
    { title: 'Follow-ups Today', value: todayFollowups, icon: Calendar, color: 'text-orange-500' },
    { title: 'Tasks Completed', value: completedTasks, icon: CheckSquare, color: 'text-purple-500' },
    { title: 'Revenue', value: totalRevenue.toLocaleString(), icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Conversion Rate', value: conversionRate, icon: Target, color: 'text-pink-500' },
  ]

  const chartData = Object.values(
    leads.reduce((months, lead) => {
      const name = monthName(lead.createdAt)
      months[name] = months[name] || { name, leads: 0, revenue: 0 }
      months[name].leads += 1
      months[name].revenue += Number(lead.expectedValue || 0)
      return months
    }, {} as Record<string, { name: string; leads: number; revenue: number }>)
  )

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here is your live CRM overview.</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">From Excel-backed CRM data</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expected Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
