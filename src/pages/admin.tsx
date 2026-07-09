import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'
import {
  Activity,
  Building2,
  CheckCircle2,
  Download,
  Edit,
  FileDown,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
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
  employeeId?: string
  email: string
  role: string
  avatar?: string
  mobile?: string
  department?: string
  designation?: string
  reportingManager?: string
  status?: string
  joiningDate?: string
  officeLocation?: string
  timeZone?: string
  language?: string
  signature?: string
  sendWelcomeEmail?: string | boolean
  forcePasswordChange?: string | boolean
  twoFactorEnabled?: string | boolean
  allowMobileLogin?: string | boolean
  allowDesktopLogin?: string | boolean
  lastLogin?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

type UserForm = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string
  confirmPassword: string
}

const defaultForm: UserForm = {
  name: '',
  employeeId: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'sales_executive',
  avatar: '',
  mobile: '',
  department: 'Sales',
  designation: '',
  reportingManager: '',
  status: 'active',
  joiningDate: new Date().toISOString().slice(0, 10),
  officeLocation: 'Head Office',
  timeZone: 'Asia/Kolkata',
  language: 'English',
  signature: '',
  sendWelcomeEmail: true,
  forcePasswordChange: false,
  twoFactorEnabled: false,
  allowMobileLogin: true,
  allowDesktopLogin: true,
  createdBy: 'admin',
}

const roles = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Company Admin', value: 'company_admin' },
  { label: 'Director', value: 'director' },
  { label: 'General Manager', value: 'general_manager' },
  { label: 'Sales Manager', value: 'sales_manager' },
  { label: 'Sales Executive', value: 'sales_executive' },
  { label: 'Purchase Manager', value: 'purchase_manager' },
  { label: 'Purchase Executive', value: 'purchase_executive' },
  { label: 'Accounts Manager', value: 'accounts_manager' },
  { label: 'Accounts Executive', value: 'accounts_executive' },
  { label: 'Dispatch Manager', value: 'dispatch_manager' },
  { label: 'Production Manager', value: 'production_manager' },
  { label: 'HR Manager', value: 'hr_manager' },
  { label: 'Marketing Manager', value: 'marketing_manager' },
  { label: 'Customer Support', value: 'customer_support' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Auditor', value: 'auditor' },
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
]

const departments = ['Sales', 'Purchase', 'Accounts', 'HR', 'Production', 'Dispatch', 'Logistics', 'Marketing', 'Management', 'IT']
const permissionModules = ['Dashboard', 'Leads', 'Customers', 'Vendors', 'Quotations', 'Purchase Orders', 'Sales Orders', 'Invoices', 'Payments', 'Inventory', 'Products', 'Dispatch', 'Projects', 'Tasks', 'Calendar', 'Emails', 'Reports', 'CRM Settings', 'User Management', 'Audit Logs']
const permissionActions = ['View', 'Create', 'Edit', 'Delete', 'Export', 'Import', 'Approve', 'Reject', 'Print', 'Assign']

function roleLabel(value: string) {
  return roles.find((role) => role.value === value)?.label || value.replace(/_/g, ' ')
}

function isTruthy(value: unknown) {
  return value === true || String(value).toLowerCase() === 'true'
}

function formatDateTime(value?: string) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function Admin() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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
    return users.filter((item) => {
      const matchesSearch = !term || [item.name, item.employeeId, item.email, item.role, item.mobile, item.department, item.status].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
      const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter
      const matchesStatus = statusFilter === 'all' || (item.status || 'active') === statusFilter
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [departmentFilter, search, statusFilter, users])

  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return {
      total: users.length,
      active: users.filter((item) => (item.status || 'active') === 'active').length,
      inactive: users.filter((item) => (item.status || 'active') === 'inactive').length,
      online: users.filter((item) => item.lastLogin && Date.now() - new Date(item.lastLogin).getTime() < 30 * 60 * 1000).length,
      invitations: users.filter((item) => item.status === 'invited').length,
      departments: new Set(users.map((item) => item.department).filter(Boolean)).size,
      roles: new Set(users.map((item) => item.role).filter(Boolean)).size,
      newThisMonth: users.filter((item) => {
        if (!item.createdAt) return false
        const date = new Date(item.createdAt)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).length,
    }
  }, [users])

  const saveMutation = useMutation({
    mutationFn: async (override?: UserForm) => {
      const { confirmPassword, ...payload } = override || form
      if (editingUser) {
        return api.put(`/auth/${editingUser.id}`, payload)
      }
      return api.post('/auth', payload)
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/auth/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Could not update user status')
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
      ...defaultForm,
      name: item.name,
      employeeId: item.employeeId || '',
      email: item.email,
      password: '',
      confirmPassword: '',
      role: item.role,
      avatar: item.avatar || '',
      mobile: item.mobile || '',
      department: item.department || 'Sales',
      designation: item.designation || '',
      reportingManager: item.reportingManager || '',
      status: item.status || 'active',
      joiningDate: item.joiningDate || '',
      officeLocation: item.officeLocation || 'Head Office',
      timeZone: item.timeZone || 'Asia/Kolkata',
      language: item.language || 'English',
      signature: item.signature || '',
      sendWelcomeEmail: item.sendWelcomeEmail ?? false,
      forcePasswordChange: item.forcePasswordChange ?? false,
      twoFactorEnabled: item.twoFactorEnabled ?? false,
      allowMobileLogin: item.allowMobileLogin ?? true,
      allowDesktopLogin: item.allowDesktopLogin ?? true,
      createdBy: item.createdBy || 'admin',
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
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Password and confirm password must match')
      return
    }
    saveMutation.mutate(undefined)
  }

  const saveAndInvite = () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required')
      return
    }
    if (!editingUser && (!form.password || form.password !== form.confirmPassword)) {
      toast.error('Valid password and confirmation are required')
      return
    }
    saveMutation.mutate({ ...form, sendWelcomeEmail: true, status: form.status === 'inactive' ? 'active' : form.status })
  }

  const exportRows = () => filteredUsers.map((item) => ({
    Photo: item.avatar ? 'Available' : '',
    Name: item.name,
    'Employee ID': item.employeeId || '',
    Email: item.email,
    Mobile: item.mobile || '',
    Department: item.department || '',
    Role: roleLabel(item.role),
    Status: item.status || 'active',
    'Last Login': item.lastLogin || '',
    'Created By': item.createdBy || '',
  }))

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportRows())
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
    XLSX.writeFile(workbook, 'nexxus-users.xlsx')
  }

  const exportCsv = async () => {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(exportRows())
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'nexxus-users.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Nexxus CRM User Report', 14, 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, 14, 25)
    let y = 36
    filteredUsers.slice(0, 35).forEach((item, index) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${item.name} (${item.employeeId || 'No ID'})`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${item.email} | ${item.mobile || '-'} | ${item.department || '-'} | ${roleLabel(item.role)} | ${item.status || 'active'}`, 14, y + 5)
      y += 11
      if (y > 280) {
        doc.addPage()
        y = 18
      }
    })
    doc.save('nexxus-users.pdf')
  }

  const bulkStatus = async (status: string) => {
    await Promise.all(selectedIds.map((id) => updateStatusMutation.mutateAsync({ id, status })))
    toast.success(`Updated ${selectedIds.length} users`)
    setSelectedIds([])
  }

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected users?`)) return
    await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)))
    toast.success(`Deleted ${selectedIds.length} users`)
    setSelectedIds([])
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

  const currentRole = String(user?.role || '')
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

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
          <h1 className="text-3xl font-bold">User Control Center</h1>
          <p className="text-muted-foreground">Manage users, roles, departments, security, and activity controls</p>
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
            Create User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Users', metrics.total, Users],
          ['Active Users', metrics.active, UserCheck],
          ['Inactive Users', metrics.inactive, Lock],
          ['Online Users', metrics.online, CheckCircle2],
          ['Pending Invitations', metrics.invitations, Mail],
          ['Departments', metrics.departments, Building2],
          ['Roles', metrics.roles, Shield],
          ['New Users This Month', metrics.newThisMonth, UserPlus],
        ].map(([label, value, Icon]) => {
          const MetricIcon = Icon as typeof Users
          return (
            <Card key={String(label)}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{String(label)}</p>
                  <p className="text-2xl font-bold">{String(value)}</p>
                </div>
                <MetricIcon className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Professional User List</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={exportPdf}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, employee ID, department..."
                  className="pl-8"
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option value={department} key={department}>{department}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="invited">Pending Invitation</option>
                <option value="locked">Locked</option>
              </select>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <span>{selectedIds.length} selected</span>
                <Button size="sm" variant="outline" onClick={() => bulkStatus('active')}>Bulk Activate</Button>
                <Button size="sm" variant="outline" onClick={() => bulkStatus('inactive')}>Bulk Deactivate</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success('Invitations queued')}>Send Invitation</Button>
                <Button size="sm" variant="destructive" onClick={bulkDelete}>Bulk Delete</Button>
              </div>
            )}
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
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                        onChange={(event) => setSelectedIds(event.target.checked ? filteredUsers.map((item) => item.id) : [])}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Photo</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Employee ID</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Mobile</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Login</th>
                    <th className="px-4 py-3 font-medium">Created By</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr className="border-t" key={item.id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => setSelectedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold">
                          {item.avatar ? <img src={item.avatar} alt="" className="h-full w-full object-cover" /> : item.name.slice(0, 1)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {item.name}
                        <p className="text-xs text-muted-foreground">{item.designation || '-'}</p>
                      </td>
                      <td className="px-4 py-3">{item.employeeId || '-'}</td>
                      <td className="px-4 py-3">{item.email}</td>
                      <td className="px-4 py-3">{item.mobile || '-'}</td>
                      <td className="px-4 py-3">{item.department || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.role === 'admin' ? 'default' : 'secondary'}>
                          {roleLabel(item.role)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(item.status || 'active') === 'active' ? 'default' : 'secondary'}>
                          {item.status || 'active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{formatDateTime(item.lastLogin)}</td>
                      <td className="px-4 py-3">{item.createdBy || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toast.success('Password reset queued')}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toast.success('Invitation queued')}>
                            <Mail className="h-4 w-4" />
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Roles & Permissions</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-3">Module</th>
                  {permissionActions.map((permission) => (
                    <th className="px-3 py-3" key={permission}>{permission}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionModules.slice(0, 10).map((module) => (
                  <tr className="border-t" key={module}>
                    <td className="px-3 py-3 font-medium">{module}</td>
                    {permissionActions.map((permission, index) => (
                      <td className="px-3 py-3" key={permission}>
                        <input type="checkbox" defaultChecked={index < 3 || module === 'Dashboard'} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Management</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {departments.map((department) => {
              const count = users.filter((item) => item.department === department).length
              const head = users.find((item) => item.department === department && item.role.includes('manager'))
              return (
                <div className="rounded-md border p-3" key={department}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{department}</p>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Head: {head?.name || 'Not assigned'}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Assign</Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Branch & Company Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Company:</span> Nexxus Group</p>
            <p><span className="text-muted-foreground">Branch:</span> Head Office</p>
            <p><span className="text-muted-foreground">GST / PAN / CIN:</span> Managed in Settings</p>
            <p><span className="text-muted-foreground">Data Isolation:</span> Company scoped</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">Assign Users</Button>
              <Button size="sm" variant="outline">Assign Departments</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Login Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Minimum 8 characters', 'Uppercase and lowercase', 'Number and special character', 'Failed login lock', 'IP restriction', 'Device restriction', '2FA', 'Session timeout'].map((item) => (
              <label className="flex items-center gap-3 text-sm" key={item}>
                <input type="checkbox" defaultChecked />
                {item}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.slice(0, 5).map((item) => (
              <div className="rounded-md border p-3 text-sm" key={item.id}>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">User management activity tracked</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.updatedAt || item.createdAt)}</p>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </CardContent>
        </Card>
      </div>

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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" value={form.employeeId || ''} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} required onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.department || 'Sales'}
                    onChange={(event) => setForm({ ...form, department: event.target.value })}
                  >
                    {departments.map((department) => (
                      <option value={department} key={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" value={form.designation || ''} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportingManager">Reporting Manager</Label>
                  <Input id="reportingManager" value={form.reportingManager || ''} onChange={(event) => setForm({ ...form, reportingManager: event.target.value })} />
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
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.status || 'active'}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="invited">Pending Invitation</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input id="joiningDate" type="date" value={form.joiningDate || ''} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeLocation">Office Location</Label>
                  <Input id="officeLocation" value={form.officeLocation || ''} onChange={(event) => setForm({ ...form, officeLocation: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Input id="timeZone" value={form.timeZone || ''} onChange={(event) => setForm({ ...form, timeZone: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input id="language" value={form.language || ''} onChange={(event) => setForm({ ...form, language: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Photo URL</Label>
                  <Input id="avatar" value={form.avatar || ''} onChange={(event) => setForm({ ...form, avatar: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature">Signature Upload URL</Label>
                  <Input id="signature" value={form.signature || ''} onChange={(event) => setForm({ ...form, signature: event.target.value })} />
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    required={!editingUser}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {[
                  ['Send Welcome Email', 'sendWelcomeEmail'],
                  ['Force Password Change', 'forcePasswordChange'],
                  ['Two Factor Authentication', 'twoFactorEnabled'],
                  ['Allow Mobile Login', 'allowMobileLogin'],
                  ['Allow Desktop Login', 'allowDesktopLogin'],
                ].map(([label, key]) => (
                  <label className="flex items-center gap-3 rounded-md border p-3 text-sm" key={key}>
                    <input
                      type="checkbox"
                      checked={isTruthy(form[key as keyof UserForm])}
                      onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="button" variant="outline" onClick={saveAndInvite} disabled={saveMutation.isPending}>
                  Save & Invite
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
