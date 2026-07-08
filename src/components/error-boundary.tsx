import { Component, ReactNode } from 'react'
import { Button } from './ui/button'
import { toDisplayMessage } from '@/utils/message'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: toDisplayMessage(error, 'The page could not be loaded.'),
    }
  }

  componentDidCatch(error: Error) {
    console.error('Page crashed:', error)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Could not load this page</h2>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.message}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                window.location.href = '/login'
              }}
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
