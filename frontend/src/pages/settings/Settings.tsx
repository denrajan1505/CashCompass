import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { CURRENCIES } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' }, { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' }, { code: 'gu', name: 'Gujarati' },
]

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      preferred_currency: user?.preferred_currency || 'INR',
      preferred_language: user?.preferred_language || 'en',
    },
  })

  const update = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => { updateUser(data); toast.success('Profile updated!') },
    onError: () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Profile</h2>
        <form onSubmit={handleSubmit(d => update.mutate(d))} className="space-y-4">
          <Input label="Full Name" {...register('full_name')} />
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Email</label>
            <p className="text-gray-500 text-sm bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5">{user?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Default Currency</label>
              <select className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('preferred_currency')}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Language</label>
              <select className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('preferred_language')}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <Button type="submit" loading={update.isPending}>Save Changes</Button>
        </form>
      </Card>

      {/* Subscription */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium capitalize">{user?.subscription_status} Plan</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {user?.subscription_status === 'free' ? '7 expenses/day · 7 AI messages/day' : 'Unlimited expenses & AI messages'}
            </p>
          </div>
          <Badge variant={user?.subscription_status === 'free' ? 'default' : 'purple'}>
            {user?.subscription_status?.toUpperCase()}
          </Badge>
        </div>
        {user?.subscription_status === 'free' && (
          <Button className="mt-4 w-full" onClick={() => window.location.href = '/subscription'}>
            Upgrade to Pro — ₹499/month
          </Button>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-gray-500 text-sm mb-4">These actions are irreversible.</p>
        <Button variant="danger" size="sm">Delete Account</Button>
      </Card>
    </div>
  )
}
