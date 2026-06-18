import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Compass, User, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

interface FormData { full_name: string; email: string; password: string; confirm: string }

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()
  const [loading, setLoading] = useState(false)

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await authApi.register({ full_name: data.full_name, email: data.email, password: data.password })
      setAuth(res.user, res.access_token, res.refresh_token)
      toast.success('Welcome to CashCompass!')
      navigate('/dashboard')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-500 mt-1">Start tracking smarter with AI</p>
        </div>

        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name', { required: 'Name is required' })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirm?.message}
              {...register('confirm', {
                required: 'Please confirm password',
                validate: v => v === watch('password') || 'Passwords do not match',
              })}
            />

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-4">
            By signing up, you agree to our Terms & Privacy Policy.
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
