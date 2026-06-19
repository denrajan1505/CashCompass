import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Clock } from 'lucide-react'
import Sidebar from './Sidebar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'

const WARN_SECONDS = 60

export default function Layout() {
  const { logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(WARN_SECONDS)

  const handleTimeout = useCallback(() => {
    setShowWarning(false)
    logout()
    navigate('/login')
  }, [logout, navigate])

  const handleWarn = useCallback(() => {
    setShowWarning(true)
    setCountdown(WARN_SECONDS)
  }, [])

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false)
    setCountdown(WARN_SECONDS)
  }, [])

  const handleActivityReset = useCallback(() => {
    if (!showWarning) return
  }, [showWarning])

  useIdleTimeout({
    enabled: isAuthenticated(),
    onWarn: handleWarn,
    onTimeout: handleTimeout,
    onActivity: handleActivityReset,
  })

  useEffect(() => {
    if (!showWarning) return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showWarning])

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a26', color: '#fff', border: '1px solid #3a3a50' },
          success: { iconTheme: { primary: '#6C63FF', secondary: '#fff' } },
        }}
      />

      <Modal open={showWarning} onClose={handleStayLoggedIn} title="Session Expiring Soon" size="sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <p className="text-gray-300 text-sm">You've been inactive for 15 minutes.</p>
            <p className="text-gray-400 text-sm mt-1">You'll be logged out automatically in</p>
            <p className="text-4xl font-bold text-amber-400 mt-2">{countdown}s</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Button variant="ghost" className="flex-1" onClick={handleTimeout}>Logout Now</Button>
            <Button className="flex-1" onClick={handleStayLoggedIn}>Stay Logged In</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
