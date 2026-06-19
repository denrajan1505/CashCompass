import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Receipt, Wallet, PieChart, MessageSquare,
  Settings, LogOut, Compass, CreditCard, Mic,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/analytics', icon: PieChart, label: 'Analytics' },
  { to: '/receipts', icon: Mic, label: 'Receipt Scanner', pro: true },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 h-screen bg-dark-800 border-r border-dark-600 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">CashCompass</h1>
            <p className="text-xs text-gray-500 mt-0.5">Finance AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, pro }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {pro && <Badge variant="purple" className="text-[10px]">PRO</Badge>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-dark-600 space-y-1">
        {user?.subscription_status === 'free' && (
          <NavLink to="/subscription"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all border border-amber-500/20 mb-2">
            <CreditCard className="w-4 h-4" />
            <span>Upgrade to Pro</span>
          </NavLink>
        )}
        <NavLink to="/settings"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            isActive ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:bg-dark-700 hover:text-white'
          )}>
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
        <button onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>

        <Modal open={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout" size="sm">
          <p className="text-gray-400 text-sm mb-6">Are you sure you want to log out? You'll need to sign in again to access your account.</p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleLogout}>Yes, Logout</Button>
          </div>
        </Modal>

        {/* User */}
        {user && (
          <div className="mt-3 px-3 py-2.5 bg-dark-700 rounded-xl">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <Badge variant={user.is_admin ? 'purple' : user.subscription_status === 'free' ? 'default' : 'purple'} className="mt-1">
              {user.is_admin ? 'ADMIN' : user.subscription_status.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>
    </aside>
  )
}
