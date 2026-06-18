import { Link } from 'react-router-dom'
import { Compass, Mic, Receipt, MessageSquare, PieChart, Shield, Zap, Check, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'

const FEATURES = [
  { icon: PieChart, title: 'Smart Analytics', desc: 'Visual breakdowns of spending by category, merchant, and time period.' },
  { icon: Mic, title: 'Voice Entry', desc: 'Add expenses by speaking in Hindi, Tamil, Telugu, and 19 more Indian languages.' },
  { icon: Receipt, title: 'Receipt Scanner', desc: 'Snap a photo. Gemini AI extracts merchant, amount, and date instantly.' },
  { icon: MessageSquare, title: 'AI Finance Chat', desc: 'Ask GPT-4o anything about your money. Get instant, personalized answers.' },
  { icon: Zap, title: 'Budget Alerts', desc: 'Set monthly limits per category and get alerts before you overspend.' },
  { icon: Shield, title: 'Multi-Currency', desc: 'Track expenses in 40+ currencies with real-time exchange rates.' },
]

const PRICING = [
  { name: 'Free', price: '₹0', features: ['7 expenses/day', '7 AI messages/day', 'Basic analytics'], cta: 'Get Started' },
  {
    name: 'Pro', price: '₹499', period: '/month', popular: true,
    features: ['Unlimited expenses', 'Unlimited AI chat', 'Receipt scanner', 'Voice entry', '40+ currencies', 'Advanced analytics'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Premium', price: '₹999', period: '/month',
    features: ['Everything in Pro', 'Family accounts', 'Priority support', 'Advanced insights'],
    cta: 'Get Premium',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Nav */}
      <nav className="border-b border-dark-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-dark-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">CashCompass</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
          <Link to="/register"><Button size="sm">Get Started Free</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-sm text-primary-400 mb-6">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered · GPT-4o · Google Gemini · Sarvam AI
        </div>
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Track Every Rupee.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-pink-400">
            Powered by AI.
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          CashCompass helps students, freelancers, and professionals track expenses using voice, receipts, and AI chat — no spreadsheets needed.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>Start Free — No Card Required</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="lg">Sign In</Button>
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-4">Free forever · Pro from ₹499/month</p>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need to manage money</h2>
        <p className="text-gray-500 text-center mb-12">Built for India. Works globally.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-dark-800 border border-dark-600 rounded-2xl p-6 hover:border-primary-500/30 transition-colors">
              <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Simple Pricing</h2>
        <p className="text-gray-500 text-center mb-12">Start free. Upgrade when you're ready.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRICING.map(p => (
            <div key={p.name} className={`bg-dark-800 border rounded-2xl p-6 flex flex-col ${p.popular ? 'border-primary-500/50 ring-1 ring-primary-500/30' : 'border-dark-600'}`}>
              {p.popular && (
                <div className="text-xs font-medium text-primary-400 bg-primary-500/10 rounded-full px-3 py-1 w-fit mb-4">Most Popular</div>
              )}
              <h3 className="font-bold text-lg text-white">{p.name}</h3>
              <div className="my-3">
                <span className="text-3xl font-bold text-white">{p.price}</span>
                {p.period && <span className="text-gray-500 text-sm">{p.period}</span>}
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant={p.popular ? 'primary' : 'outline'} className="w-full">{p.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 px-6 py-8 text-center text-gray-600 text-sm">
        <p>© 2026 CashCompass · Built with FastAPI · React · GPT-4o · Google Gemini · Sarvam AI</p>
      </footer>
    </div>
  )
}
