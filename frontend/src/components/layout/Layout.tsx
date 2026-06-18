import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
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
    </div>
  )
}
