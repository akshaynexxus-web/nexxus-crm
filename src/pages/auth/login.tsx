import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { toDisplayMessage } from '@/utils/message'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError('')
    try {
      await login(data.email, data.password)
      toast.success('Signed in successfully')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      const rawMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.message || error.message
        : 'Could not sign in'
      const message = toDisplayMessage(rawMessage, 'Could not sign in')
      const friendlyMessage = message === 'Network Error'
        ? 'Could not reach the server. Check the Vercel deployment and /api/health.'
        : message
      setLoginError(friendlyMessage)
      toast.error(friendlyMessage)
    }
  }

  const onInvalid = () => {
    setLoginError('Enter a valid email and a password with at least 6 characters.')
    toast.error('Check the email and password fields.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {toDisplayMessage(errors.email.message, 'Invalid email address')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {toDisplayMessage(errors.password.message, 'Password is required')}
                  </p>
                )}
              </div>
              {loginError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {loginError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
