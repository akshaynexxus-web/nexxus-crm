import { FormEvent, ReactNode, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react'
import { api, getArrayData } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'

type FieldType = 'text' | 'email' | 'number' | 'date' | 'select'

export type EntityField<T extends Record<string, any>> = {
  key: keyof T & string
  label: string
  type?: FieldType
  required?: boolean
  options?: Array<{ label: string; value: string }>
  list?: boolean
}

type EntityManagerProps<T extends Record<string, any>> = {
  title: string
  description: string
  endpoint: string
  queryKey: string
  addLabel: string
  fields: EntityField<T>[]
  defaults: T
  searchKeys: Array<keyof T & string>
  primaryKey: keyof T & string
  secondaryKey?: keyof T & string
  amountKey?: keyof T & string
  importEndpoint?: string
  importLabel?: string
  importControl?: ReactNode
}

type Mode = 'create' | 'edit' | 'view'

function storageKey(queryKey: string) {
  return `nexxus-crm:${queryKey}`
}

function readLocalRecords<T>(queryKey: string): T[] {
  try {
    const value = localStorage.getItem(storageKey(queryKey))
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

function writeLocalRecords<T>(queryKey: string, records: T[]) {
  try {
    localStorage.setItem(storageKey(queryKey), JSON.stringify(records))
  } catch {
    // Browser storage can be unavailable in private or restricted sessions.
  }
}

function mergeRecords<T extends Record<string, any>>(remote: T[], local: T[]) {
  const records = new Map<string, T>()
  local.forEach((record) => records.set(String(record.id), record))
  remote.forEach((record) => records.set(String(record.id), record))
  return Array.from(records.values())
}

export function EntityManager<T extends Record<string, any>>({
  title,
  description,
  endpoint,
  queryKey,
  addLabel,
  fields,
  defaults,
  searchKeys,
  primaryKey,
  secondaryKey,
  amountKey,
  importEndpoint,
  importLabel,
  importControl,
}: EntityManagerProps<T>) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<Mode | null>(null)
  const [selected, setSelected] = useState<T | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [form, setForm] = useState<T>(defaults)

  const { data = [], isLoading } = useQuery<T[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await api.get(endpoint)
      return mergeRecords(getArrayData<T>(response.data), readLocalRecords<T>(queryKey))
    },
  })

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return data
    return data.filter((item) =>
      searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(term))
    )
  }, [data, search, searchKeys])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'edit' && selected?.id) {
        return api.put(`${endpoint}/${selected.id}`, form)
      }
      return api.post(endpoint, form)
    },
    onSuccess: (response) => {
      const saved = response.data?.data as T | undefined
      if (saved?.id) {
        const current = queryClient.getQueryData<T[]>([queryKey]) || data
        const next =
          mode === 'edit'
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current.filter((item) => item.id !== saved.id)]

        writeLocalRecords(queryKey, next)
        queryClient.setQueryData([queryKey], next)
      } else {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      }
      toast.success(mode === 'edit' ? `${title.slice(0, -1)} updated` : `${title.slice(0, -1)} added`)
      closeModal()
    },
    onError: () => toast.error('Could not save record'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      const current = queryClient.getQueryData<T[]>([queryKey]) || data
      const next = current.filter((item) => item.id !== deleteTarget?.id)
      writeLocalRecords(queryKey, next)
      queryClient.setQueryData([queryKey], next)
      toast.success('Record deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Could not delete record'),
  })

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post(importEndpoint || '', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      toast.success(`Imported ${response.data.imported || 0} records`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Could not import Excel file')
    },
  })

  const openCreate = () => {
    setForm(defaults)
    setSelected(null)
    setMode('create')
  }

  const openEdit = (item: T) => {
    setForm({ ...defaults, ...item })
    setSelected(item)
    setMode('edit')
  }

  const openView = (item: T) => {
    setSelected(item)
    setMode('view')
  }

  const closeModal = () => {
    setMode(null)
    setSelected(null)
    setForm(defaults)
  }

  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate()
  }

  const updateField = (field: EntityField<T>, value: string) => {
    setForm((current) => ({
      ...current,
      [field.key]: field.type === 'number' ? Number(value) : value,
    }))
  }

  const formatValue = (value: any, field?: EntityField<T>) => {
    if (field?.type === 'date' && value) return new Date(value).toLocaleDateString()
    if (field?.type === 'number') return Number(value || 0).toLocaleString()
    return String(value ?? '')
  }

  const listFields = fields.filter((field) => field.list !== false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {importControl}
          {importEndpoint && user?.role === 'admin' && (
            <>
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
                {importMutation.isPending ? 'Importing...' : importLabel || 'Import Excel'}
              </Button>
            </>
          )}
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>{title} List</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-16 animate-pulse rounded-md bg-muted/50" key={item} />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <EmptyState
              title={search ? `No matching ${title.toLowerCase()}` : `No ${title.toLowerCase()} yet`}
              description={search ? 'Try a different search term or clear the search field.' : `Create your first record to start managing ${title.toLowerCase()}.`}
              actionLabel={search ? undefined : addLabel}
              onAction={search ? undefined : openCreate}
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    {listFields.slice(0, 5).map((field) => (
                      <th className="px-4 py-3 font-medium" key={field.key}>
                        {field.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr className="border-t" key={item.id}>
                      {listFields.slice(0, 5).map((field) => (
                        <td className="px-4 py-3" key={field.key}>
                          {field.type === 'select' ? (
                            <Badge variant="secondary">{formatValue(item[field.key], field)}</Badge>
                          ) : (
                            formatValue(item[field.key], field)
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label={`View ${String(item[primaryKey] || 'record')}`} onClick={() => openView(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Edit ${String(item[primaryKey] || 'record')}`} onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${String(item[primaryKey] || 'record')}`}
                            onClick={() => setDeleteTarget(item)}
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

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {mode === 'view' ? 'View' : mode === 'edit' ? 'Edit' : 'Add'} {title.slice(0, -1)}
                </h2>
                {selected && (
                  <p className="text-sm text-muted-foreground">
                    {String(selected[primaryKey] ?? '')}
                    {secondaryKey ? ` - ${String(selected[secondaryKey] ?? '')}` : ''}
                    {amountKey ? ` - ${String(selected[amountKey] ?? '')}` : ''}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" aria-label="Close record dialog" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {mode === 'view' && selected ? (
              <div className="grid gap-4 p-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div className="rounded-md border p-3" key={field.key}>
                    <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
                    <div className="mt-1 break-words">{formatValue(selected[field.key], field) || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={saveRecord} className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <div className="space-y-2" key={field.key}>
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.type === 'select' ? (
                        <select
                          id={field.key}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={String(form[field.key] ?? '')}
                          required={field.required}
                          onChange={(event) => updateField(field, event.target.value)}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option) => (
                            <option value={option.value} key={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type || 'text'}
                          value={String(form[field.key] ?? '')}
                          required={field.required}
                          onChange={(event) => updateField(field, event.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${title.slice(0, -1)}`}
          description={`This will permanently delete "${String(deleteTarget[primaryKey] || 'this record')}". This action cannot be undone.`}
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      )}
    </div>
  )
}
