import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel?: string
  isPending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h2 id="confirm-title" className="text-base font-semibold">{title}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close confirmation" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
              {isPending ? 'Deleting...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
