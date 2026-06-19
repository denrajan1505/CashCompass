import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { authApi } from '@/api/auth'

interface FormData { password: string; confirm: string }

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()

  async function onSubmit(data: FormData) {
    if (!token) { toast.error('Invalid or missing reset token'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(token, data.password)
      setDone(true)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <p className="text-red-400 text-lg">Invalid reset link.</p>
          <Link to="/forgot-password" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mt-4">
            <ArrowLeft className="w-4 h-4" /> Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Password reset!</h2>
          <p className="text-gray-500 mt-2">Your password has been updated successfully.</p>
          <Button className="mt-6" onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-gray-500 mt-1">Must be at least 8 characters with uppercase, lowercase, number & symbol</p>
        </div>
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password', {
                required: 'Password required',
                validate: v => {
                  if (v.length < 8) return 'Min 8 characters'
                  if (!/[A-Z]/.test(v)) return 'Must include an uppercase letter'
                  if (!/[a-z]/.test(v)) return 'Must include a lowercase letter'
                  if (!/[0-9]/.test(v)) return 'Must include a number'
                  if (!/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(v)) return 'Must include a special character'
                  return true
                },
              })}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter new password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirm?.message}
              {...register('confirm', {
                required: 'Please confirm password',
                validate: v => v === watch('password') || 'Passwords do not match',
              })}
            />
            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Reset Password
            </Button>
          </form>
          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
