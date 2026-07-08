import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type DuplicateMode = 'skip' | 'update' | 'create'

type ParsedRow = {
  row: number
  company: string
  personName: string
  mobile: string
  email: string
  status: 'ready' | 'error'
  issue: string
}

type ImportResult = {
  totalRows: number
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; reason: string }>
  previews?: Array<{ row: number; action: string; company: string; personName: string; mobile: string; email: string }>
}

const templateRows = [
  {
    company: 'Example Industries',
    personName: 'Rahul Sharma',
    mobile: '9876543210',
    whatsapp: '9876543210',
    email: 'rahul@example.com',
    gst: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: 'Office address',
    source: 'website',
    industry: 'manufacturing',
    requirement: 'Product requirement',
    products: 'Product A, Product B',
    priority: 'medium',
    status: 'new',
    assignedTo: 'Admin User',
    expectedValue: 50000,
    notes: 'Imported from Excel',
    tags: 'hot, website',
  },
]

const fieldAliases: Record<string, string[]> = {
  company: ['company', 'companyname', 'customer', 'customername', 'client', 'clientname', 'firm', 'businessname', 'organization', 'organisation'],
  personName: ['personname', 'contactperson', 'contactname', 'person', 'name', 'leadname', 'customerperson'],
  mobile: ['mobile', 'mobileno', 'mobilenumber', 'phone', 'phoneno', 'phonenumber', 'contactnumber', 'contactno', 'cell'],
  email: ['email', 'emailid', 'mail', 'mailid'],
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function pickValue(row: Record<string, any>, key: string) {
  const aliases = fieldAliases[key] || [key]
  const normalizedKey = Object.keys(row).find((item) => aliases.includes(normalizeHeader(item)))
  return normalizedKey ? String(row[normalizedKey] ?? '').trim() : ''
}

export function LeadImportDialog() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('skip')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const summary = useMemo(() => {
    const valid = rows.filter((row) => row.status === 'ready').length
    const invalid = rows.length - valid
    return { valid, invalid }
  }, [rows])

  const downloadTemplate = () => {
    import('xlsx').then((XLSX) => {
    const worksheet = XLSX.utils.json_to_sheet(templateRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
    XLSX.writeFile(workbook, 'leads-import-template.xlsx')
    })
  }

  const parseFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setResult(null)
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(await selectedFile.arrayBuffer())
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' })

    setRows(
      jsonRows.map((row, index) => {
        const company = pickValue(row, 'company')
        const personName = pickValue(row, 'personName')
        const mobile = pickValue(row, 'mobile')
        const email = pickValue(row, 'email')
        const issues = []

        if (!company) issues.push('Company missing')
        if (!personName && !mobile && !email) issues.push('Contact missing')

        return {
          row: index + 2,
          company,
          personName,
          mobile,
          email,
          status: issues.length ? 'error' : 'ready',
          issue: issues.join(', '),
        }
      })
    )
  }

  const importLeads = async (dryRun: boolean) => {
    if (!file) {
      toast.error('Select an Excel file first')
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('duplicateMode', duplicateMode)
      formData.append('dryRun', String(dryRun))

      const response = await api.post('/leads/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResult(response.data)
      if (dryRun) {
        toast.success('Preview completed')
      } else {
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        const imported = response.data.imported || 0
        const updated = response.data.updated || 0
        const skipped = response.data.skipped || 0
        toast.success(imported || updated ? `Imported ${imported}, updated ${updated}` : `Imported 0. Skipped ${skipped}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not import leads')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Import Leads
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-md border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">Advanced Lead Import</h2>
                <p className="text-sm text-muted-foreground">Upload Excel, preview rows, validate data, and handle duplicates.</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close lead import" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="text-sm font-medium">Template</div>
                  <p className="mt-1 text-sm text-muted-foreground">Use the template for clean column names and sample values.</p>
                  <Button className="mt-3 w-full" variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                <div className="rounded-md border p-4">
                  <div className="text-sm font-medium">Excel File</div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0]
                      if (selectedFile) parseFile(selectedFile)
                      event.target.value = ''
                    }}
                  />
                  <Button className="mt-3 w-full" onClick={() => inputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  {file && <p className="mt-2 break-all text-xs text-muted-foreground">{file.name}</p>}
                </div>

                <div className="rounded-md border p-4">
                  <div className="text-sm font-medium">Duplicate Handling</div>
                  <select
                    className="mt-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={duplicateMode}
                    onChange={(event) => setDuplicateMode(event.target.value as DuplicateMode)}
                  >
                    <option value="skip">Skip existing leads</option>
                    <option value="update">Update existing leads</option>
                    <option value="create">Create anyway</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!file || isImporting} onClick={() => importLeads(true)}>
                    Preview
                  </Button>
                  <Button disabled={!file || isImporting || summary.invalid > 0} onClick={() => importLeads(false)}>
                    {isImporting ? 'Working...' : 'Import'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Rows</div>
                    <div className="text-xl font-bold">{rows.length}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Ready</div>
                    <div className="text-xl font-bold">{summary.valid}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Issues</div>
                    <div className="text-xl font-bold">{summary.invalid}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Imported</div>
                    <div className="text-xl font-bold">{result?.imported ?? 0}</div>
                  </div>
                </div>

                {result && (
                  <div className="space-y-3 rounded-md border p-3 text-sm">
                    <div>
                      Imported: <strong>{result.imported}</strong>, Updated: <strong>{result.updated}</strong>, Skipped: <strong>{result.skipped}</strong>, Errors: <strong>{result.errors?.length || 0}</strong>
                    </div>
                    {result.imported === 0 && result.updated === 0 && (
                      <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                        Nothing was added. Check duplicate handling, missing company names, or missing contact details.
                      </div>
                    )}
                    {result.errors?.length > 0 && (
                      <div className="space-y-1">
                        {result.errors.slice(0, 5).map((error) => (
                          <div key={`${error.row}-${error.reason}`} className="text-xs text-destructive">
                            Row {error.row}: {error.reason}
                          </div>
                        ))}
                      </div>
                    )}
                    {result.previews?.some((item) => item.action === 'skipped_duplicate') && (
                      <div className="text-xs text-muted-foreground">
                        Some rows were skipped because duplicate handling is set to skip existing leads.
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Company</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Mobile</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row) => (
                        <tr className="border-t" key={row.row}>
                          <td className="px-3 py-2">{row.row}</td>
                          <td className="px-3 py-2">{row.company || '-'}</td>
                          <td className="px-3 py-2">{row.personName || '-'}</td>
                          <td className="px-3 py-2">{row.mobile || '-'}</td>
                          <td className="px-3 py-2">{row.email || '-'}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.status === 'ready' ? 'secondary' : 'destructive'}>
                              {row.status === 'ready' ? 'Ready' : row.issue}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td className="px-3 py-10 text-center text-muted-foreground" colSpan={6}>
                            Choose an Excel file to preview leads.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && <p className="text-xs text-muted-foreground">Showing first 50 rows.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
