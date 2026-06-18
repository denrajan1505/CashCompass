import { useState } from 'react'
import { Check, Zap, Crown, Sparkles, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '@/api/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    icon: Sparkles,
    color: 'text-gray-400',
    features: ['7 expenses per day', '7 AI messages per day', 'Basic analytics', 'Single currency'],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹499',
    period: '/month',
    icon: Zap,
    color: 'text-primary-400',
    badge: 'Most Popular',
    features: [
      'Unlimited expenses',
      'Unlimited AI chat',
      'Receipt scanner (Gemini OCR)',
      'Voice expense entry',
      '40+ currencies',
      'Advanced analytics',
      'Budget alerts',
      'Monthly AI reports',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹999',
    period: '/month',
    icon: Crown,
    color: 'text-amber-400',
    features: [
      'Everything in Pro',
      'Family accounts (up to 5)',
      'Priority support',
      'Advanced financial insights',
      'Custom categories',
      'Data export (CSV / PDF)',
    ],
    cta: 'Upgrade to Premium',
  },
]

export default function Subscription() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState<string | null>(null)

  async function subscribe(plan: string) {
    setLoading(plan)
    try {
      const { data } = await client.post('/payments/subscribe', {
        plan_name: plan,
        success_url: `${window.location.origin}/dashboard?upgraded=true`,
        cancel_url: `${window.location.origin}/subscription`,
      })
      if (data.checkout_url) window.location.href = data.checkout_url
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Payment error')
    } finally {
      setLoading(null)
    }
  }

  if (user?.is_admin) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Admin Account</h1>
          <p className="text-gray-500 mt-2">You have unrestricted access to all features</p>
        </div>
        <Card className="flex flex-col items-center py-10 border-emerald-500/50 ring-1 ring-emerald-500/30">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Admin Plan</h2>
          <p className="text-gray-500 text-sm mb-6">Full access — no limits, no payments required</p>
          <ul className="space-y-2 mb-6">
            {[
              'Unlimited expenses',
              'Unlimited AI chat',
              'Receipt scanner (Gemini OCR)',
              'Voice expense entry',
              '40+ currencies',
              'Advanced analytics',
              'Budget alerts',
              'Monthly AI reports',
              'All premium features',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Badge variant="purple">Admin Access Active</Badge>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-gray-500 mt-2">Unlock the full power of AI-driven finance management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const Icon = plan.icon
          const isCurrent = user?.subscription_status === plan.id
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.id === 'pro' ? 'border-primary-500/50 ring-1 ring-primary-500/30' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="purple">{plan.badge}</Badge>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                </div>
                <div>
                  <h2 className="font-bold text-white">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">{plan.price}</span>
                    <span className="text-xs text-gray-500">{plan.period}</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? 'secondary' : plan.id === 'pro' ? 'primary' : 'outline'}
                className="w-full"
                disabled={isCurrent || plan.disabled}
                loading={loading === plan.id}
                onClick={() => !isCurrent && !plan.disabled && subscribe(plan.id)}
              >
                {isCurrent ? '✓ Current Plan' : plan.cta}
              </Button>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-600">
        All plans include 7-day free trial. Cancel anytime. Payments via Dodo Payments (UPI, Cards, NetBanking).
      </p>
    </div>
  )
}
