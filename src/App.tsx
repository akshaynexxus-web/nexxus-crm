import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute } from './components/protected-route'
import { Login } from './pages/auth/login'
import { ForgotPassword } from './pages/auth/forgot-password'
import { Dashboard } from './pages/dashboard'
import { Leads } from './pages/leads'
import { Customers } from './pages/customers'
import { FollowUps } from './pages/followups'
import { Tasks } from './pages/tasks'
import { Pipeline } from './pages/pipeline'
import { Quotations } from './pages/quotations'
import { Products } from './pages/products'
import { Reports } from './pages/reports'
import { Settings } from './pages/settings'
import { Admin } from './pages/admin'
import { Layout } from './components/layout'
import { ErrorBoundary } from './components/error-boundary'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="nexxus-theme">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><ErrorBoundary><Layout /></ErrorBoundary></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="customers" element={<Customers />} />
            <Route path="followups" element={<FollowUps />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="products" element={<Products />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
