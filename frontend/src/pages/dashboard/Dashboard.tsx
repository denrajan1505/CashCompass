import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Receipt, Target, Wallet, Sparkles } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { analyticsApi } from '@/api/analytics'
import { useAuthStore } from '@/store/authStore'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatRelativeDate } from '@/utils/formatters'
import { CATEGORY_COLORS } from '@/types'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function monthLabel(yyyymm: string) {
  const parts = yyyymm.split('-')
  return MONTH_SHORT[parseInt(parts[1], 10) - 1] || yyyymm
}

function StatCard({ label, value, sub, icon: Icon, trend }: any) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-400" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend >= 0
            ? <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            : <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {Math.abs(trend).toFixed(1)}% vs last month
          </span>
        </div>
      )}
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsApi.dashboard,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-dark-700 rounded-xl w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-dark-800 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Failed to load dashboard. Please refresh.</p>
      </div>
    )
  }

  const m = data

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your financial overview</p>
        </div>
        {user?.subscription_status === 'free' && (
          <Badge variant="warning">Free Plan · {7} AI msgs/day</Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="This Month"
          value={formatCurrency(m.total_this_month, m.currency)}
          icon={Wallet}
          trend={m.change_percent}
        />
        <StatCard
          label="Total Expenses"
          value={m.total_expenses_count}
          sub="all time"
          icon={Receipt}
        />
        <StatCard
          label="Top Category"
          value={m.top_category || '—'}
          icon={Target}
        />
        <StatCard
          label="Last Month"
          value={formatCurrency(m.total_last_month, m.currency)}
          icon={Sparkles}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending Trend — last 6 months */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Monthly Spending (last 6 months)</h2>
          {m.daily_spending.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-600 text-sm">
              No spending data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={m.daily_spending} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={monthLabel}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a26', border: '1px solid #3a3a50', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  labelFormatter={monthLabel}
                  formatter={(v: any) => [formatCurrency(v, m.currency), 'Spent']}
                  cursor={{ fill: '#6C63FF18' }}
                />
                <Bar dataKey="amount" fill="#6C63FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category Donut */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">By Category</h2>
          {m.category_breakdown.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-600 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={m.category_breakdown.map((c: any) => ({ ...c, amount: Number(c.amount) }))}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {m.category_breakdown.map((entry: any) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6C63FF'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a26', border: '1px solid #3a3a50', borderRadius: 12 }}
                    formatter={(v: any, _: any, props: any) => [formatCurrency(v, m.currency), props.payload.category]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-1">
                {m.category_breakdown.slice(0, 4).map((c: any) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[c.category] || '#6C63FF' }} />
                      <span className="text-gray-400">{c.category}</span>
                    </div>
                    <span className="text-gray-300 font-medium">{Number(c.percentage).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {m.recent_expenses.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">No expenses yet. Add your first one!</p>
          )}
          {m.recent_expenses.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: (CATEGORY_COLORS[e.category] || '#6C63FF') + '20', color: CATEGORY_COLORS[e.category] || '#6C63FF' }}>
                  {e.category[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{e.merchant || e.category}</p>
                  <p className="text-xs text-gray-500">{formatRelativeDate(e.date)}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-white">
                {formatCurrency(e.amount, e.currency)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
