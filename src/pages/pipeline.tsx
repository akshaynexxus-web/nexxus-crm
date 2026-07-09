import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lead } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { api, getArrayData } from '@/services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export function Pipeline() {
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => getArrayData<Lead>((await api.get('/leads')).data),
  })

  const pipelineData = stages.map((stage) => ({
    stage: stage.replace(/^\w/, (letter) => letter.toUpperCase()),
    count: leads.filter((lead) => lead.status === stage).length,
  }))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold">Sales Pipeline</h1>
        <p className="text-muted-foreground">Track your leads through the sales process</p>
      </motion.div>

      <Card>
        <CardHeader><CardTitle>Pipeline Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
