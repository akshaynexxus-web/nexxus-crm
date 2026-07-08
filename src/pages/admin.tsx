import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Download, Edit, Plus, Search, Shield, Trash2, UserCog, X } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type UserRecord = {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'sales_executive'
  avatar?: string
  mobile?: string
  createdAt?: string
  updatedAt?: string
}

type UserForm = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string
}

const defaultForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'sales_executive',
  avatar: '',
  mobile: '',
}

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Sales Executive', value: 'sales_executive' },
]

export function Admin() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [form, setForm] = useState<UserForm>(defaultForm)

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/auth')).data,
  })

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      openCreate()
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((item) =>
      [item.name, item.email, item.role, item.mobile].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    )
  }, [search, users])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        return api.put(`/auth/${editingUser.id}`, form)
      }
      return api.post('/auth', form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(editingUser ? 'User updated' : 'User added')
      closeModal()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Could not save user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/auth/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Could not delete user')
    },
  })

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/auth/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`Imported ${response.data.imported || 0} users`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Could not import users')
    },
  })

  const openCreate = () => {
    setEditingUser(null)
    setForm(defaultForm)
    setIsModalOpen(true)
  }

  const openEdit = (item: UserRecord) => {
    setEditingUser(item)
    setForm({
      name: item.name,
      email: item.email,
      password: '',
      role: item.role,
      avatar: item.avatar || '',
      mobile: item.mobile || '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setEditingUser(null)
    setForm(defaultForm)
    setIsModalOpen(false)
  }

  const saveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser && form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    saveMutation.mutate()
  }

  const downloadWorkbook = async () => {
    try {
      const response = await api.get('/templates/crm-workbook', { responseType: 'blob' })
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'nexxus-crm-excel-template.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Could not download Excel workbook')
    }
  }

  const isAdmin = user?.role === 'admin'

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            User management is available only to admin accounts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, roles, and account access</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadWorkbook}>
            <Download className="mr-2 h-4 w-4" />
            Excel Workbook
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) importMutation.mutate(file)
              event.target.value = ''
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
            {importMutation.isPending ? 'Importing...' : 'Import Users'}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Users</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div className="h-14 animate-pulse rounded-md bg-muted/50" key={item} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr className="border-t" key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3">{item.mobile || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.role === 'admin' ? 'default' : 'secondary'}>
                          {item.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={item.id === user?.id}
                            onClick={() => {
                              if (window.confirm('Delete this user?')) {
                                deleteMutation.mutate(item.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-md border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Add User'}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={saveUser} className="space-y-4 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} required onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input id="mobile" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.role}
                    onChange={(event) => setForm({ ...form, role: event.target.value as UserForm['role'] })}
                  >
                    {roles.map((role) => (
                      <option value={role.value} key={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password">{editingUser ? 'New Password' : 'Password'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
