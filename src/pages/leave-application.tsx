import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CalendarCheck, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LeaveForm = {
  employeeName: string
  employeeId: string
  designation: string
  department: string
  contactNumber: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  declaration: boolean
  employeeSignature: string
  signatureDate: string
}

const leaveTypes = [
  'Full Day',
  'Half Day',
  'Casual Leave',
  'Sick Leave',
  'Paid Leave',
  'Emergency Leave',
  'Work From Home',
]

const defaultForm: LeaveForm = {
  employeeName: '',
  employeeId: '',
  designation: '',
  department: '',
  contactNumber: '',
  leaveType: 'Full Day',
  startDate: '',
  endDate: '',
  reason: '',
  declaration: false,
  employeeSignature: '',
  signatureDate: new Date().toISOString().slice(0, 10),
}

function calculateDays(startDate: string, endDate: string, leaveType: string) {
  if (!startDate || !endDate) return 0

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  if (leaveType === 'Half Day') return 0.5

  const dayMs = 24 * 60 * 60 * 1000
  return Math.floor((end.getTime() - start.getTime()) / dayMs) + 1
}

function saveLeaveApplication(form: LeaveForm, totalDays: number) {
  const key = 'nexxus-crm:leave-applications'
  const current = localStorage.getItem(key)
  const records = current ? JSON.parse(current) : []

  records.unshift({
    id: `leave_${Date.now().toString(36)}`,
    ...form,
    totalDays,
    submittedAt: new Date().toISOString(),
  })

  localStorage.setItem(key, JSON.stringify(records))
}

export function LeaveApplication() {
  const [form, setForm] = useState<LeaveForm>(defaultForm)
  const totalDays = useMemo(
    () => calculateDays(form.startDate, form.endDate, form.leaveType),
    [form.startDate, form.endDate, form.leaveType]
  )

  const updateField = (field: keyof LeaveForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submitApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.declaration) {
      toast.error('Please confirm the employee declaration')
      return
    }

    if (totalDays <= 0) {
      toast.error('Please select a valid leave date range')
      return
    }

    try {
      saveLeaveApplication(form, totalDays)
      toast.success('Leave application saved')
      setForm(defaultForm)
    } catch {
      toast.error('Could not save leave application')
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Leave Application Form Details</h1>
        <p className="text-muted-foreground">Submit employee leave details for director approval</p>
      </motion.div>

      <form onSubmit={submitApplication} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input id="employeeName" value={form.employeeName} required onChange={(event) => updateField('employeeName', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID (Optional)</Label>
              <Input id="employeeId" value={form.employeeId} onChange={(event) => updateField('employeeId', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" value={form.designation} required onChange={(event) => updateField('designation', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={form.department} required onChange={(event) => updateField('department', event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input id="contactNumber" value={form.contactNumber} required onChange={(event) => updateField('contactNumber', event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <select
                id="leaveType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.leaveType}
                required
                onChange={(event) => updateField('leaveType', event.target.value)}
              >
                {leaveTypes.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalDays">Total Number of Days</Label>
              <Input id="totalDays" value={totalDays ? String(totalDays) : ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Leave Start Date</Label>
              <Input id="startDate" type="date" value={form.startDate} required onChange={(event) => updateField('startDate', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Leave End Date</Label>
              <Input id="endDate" type="date" value={form.endDate} required onChange={(event) => updateField('endDate', event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reason for Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="reason"
              className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.reason}
              required
              onChange={(event) => updateField('reason', event.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Declaration</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={form.declaration}
                onChange={(event) => updateField('declaration', event.target.checked)}
              />
              <span>
                I hereby request approval for the above-mentioned leave. I confirm that my responsibilities are properly managed during my absence.
              </span>
            </label>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Approval Process
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>After filling this form, the employee must share it in the official company group.</p>
            <p>Leave will be considered approved only after confirmation from the Directors.</p>
            <p>Employees must receive a clear approval message or acknowledgement, such as a thumbs-up reaction or written approval, before proceeding on leave.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature Section</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeSignature">Employee Signature</Label>
              <Input id="employeeSignature" value={form.employeeSignature} required onChange={(event) => updateField('employeeSignature', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureDate">Date</Label>
              <Input id="signatureDate" type="date" value={form.signatureDate} required onChange={(event) => updateField('signatureDate', event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="min-w-56">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Submit Leave Application
          </Button>
        </div>
      </form>
    </div>
  )
}
