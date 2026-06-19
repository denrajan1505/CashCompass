import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/layout/Layout'
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Dashboard from '@/pages/dashboard/Dashboard'
import ExpenseList from '@/pages/expenses/ExpenseList'
import Budgets from '@/pages/budgets/Budgets'
import Analytics from '@/pages/analytics/Analytics'
import AIChat from '@/pages/chat/AIChat'
import ReceiptScanner from '@/pages/receipts/ReceiptScanner'
import Settings from '@/pages/settings/Settings'
import Subscription from '@/pages/subscription/Subscription'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <>
    <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e2e', color: '#fff', border: '1px solid #333' } }} />
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Private — wrapped in sidebar layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/receipts" element={<ReceiptScanner />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
