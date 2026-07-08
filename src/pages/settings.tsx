import { FormEvent, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/services/api'

type SettingsForm = {
  companyName: string
  logo: string
  gst: string
  address: string
  city: string
  state: string
  country: string
  email: string
  mobile: string
  website: string
  currency: string
  taxRate: number
}

const defaultForm: SettingsForm = {
  companyName: '',
  logo: '',
  gst: '',
  address: '',
  city: '',
  state: '',
  country: '',
  email: '',
  mobile: '',
  website: '',
  currency: 'INR',
  taxRate: 18,
}

const fields: Array<{
  id: keyof SettingsForm
  label: string
  type?: string
  placeholder?: string
}> = [
  { id: 'companyName', label: 'Company Name', placeholder: 'Nexxus Group' },
  { id: 'email', label: 'Email', type: 'email', placeholder: 'contact@nexxus.com' },
  { id: 'mobile', label: 'Mobile', placeholder: '+91 98765 43210' },
  { id: 'gst', label: 'GST', placeholder: 'GST number' },
  { id: 'address', label: 'Address', placeholder: 'Business address' },
  { id: 'city', label: 'City', placeholder: 'City' },
  { id: 'state', label: 'State', placeholder: 'State' },
  { id: 'country', label: 'Country', placeholder: 'India' },
  { id: 'website', label: 'Website', placeholder: 'https://example.com' },
  { id: 'logo', label: 'Logo URL', placeholder: 'https://example.com/logo.png' },
  { id: 'currency', label: 'Currency', placeholder: 'INR' },
  { id: 'taxRate', label: 'Tax Rate', type: 'number', placeholder: '18' },
]

export function Settings() {
  const [form, setForm] = useState<SettingsForm>(defaultForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await api.get('/settings')
        setForm({
          ...defaultForm,
          ...response.data.data,
          taxRate: Number(response.data.data?.taxRate ?? defaultForm.taxRate),
        })
      } catch (error) {
        toast.error('Could not load settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateField = (id: keyof SettingsForm, value: string) => {
    setForm((current) => ({
      ...current,
      [id]: id === 'taxRate' ? Number(value) : value,
    }))
  }

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const response = await api.put('/settings', form)
      setForm({
        ...defaultForm,
        ...response.data.data,
        taxRate: Number(response.data.data?.taxRate ?? defaultForm.taxRate),
      })
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Could not save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage company variables from the Excel settings sheet</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div className="space-y-2" key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={String(form[field.id] ?? '')}
                      disabled={isLoading || isSaving}
                      onChange={(event) => updateField(field.id, event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={isLoading || isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
