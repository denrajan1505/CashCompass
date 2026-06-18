import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { CalendarX } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency, getMonthName } from '@/utils/formatters'
import { CATEGORY_COLORS } from '@/types'

export default function Analytics() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const { data, isLoading } = useQuery({
    queryKey: ['report', month, year],
    queryFn: () => analyticsApi.report(month, year),
  })

  const isEmpty = data && Number(data.total) === 0 && data.daily_spending.length === 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-500 text-sm">Deep dive into your spending</p>
        </div>
        <div className="flex gap-2">
          <select
            className="bg-dark-700 border border-dark-400 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            value={month}
            onChange={e => setMonth(+e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select
            className="bg-dark-700 border border-dark-400 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            value={year}
            onChange={e => setYear(+e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-dark-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Smart empty state */}
      {isEmpty && (
        <Card className="py-14 text-center space-y-4">
          <CalendarX className="w-12 h-12 text-gray-600 mx-auto" />
          <div>
            <p className="text-white font-semibold text-base">No expenses in {getMonthName(month)} {year}</p>
            <p className="text-gray-500 text-sm mt-1">Your expenses may be recorded under a different year</p>
          </div>
          <div className="flex gap-2 justify-center flex-wrap pt-1">
            {year > 2023 && (
              <Button size="sm" variant="secondary" onClick={() => setYear(y => y - 1)}>
                Try {getMonthName(month)} {year - 1}
              </Button>
            )}
            {year < today.getFullYear() && (
              <Button size="sm" variant="secondary" onClick={() => setYear(y => y + 1)}>
                Try {getMonthName(month)} {year + 1}
              </Button>
            )}
          </div>
        </Card>
      )}

      {data && !isEmpty && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-300">Total Spending</h2>
              <span className="text-2xl font-bold text-primary-400">
                {formatCurrency(data.total, data.currency)}
              </span>
            </div>
            <p className="text-xs text-gray-600">{getMonthName(month)} {year}</p>
          </Card>

          {/* Daily Bar Chart */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Daily Spending</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.daily_spending} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={v => v.slice(8)}
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
                  formatter={(v: any) => [formatCurrency(v, data.currency), 'Spent']}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  cursor={{ fill: '#6C63FF18' }}
                />
                <Bar dataKey="amount" fill="#6C63FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Donut */}
            <Card>
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Category Breakdown</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.category_breakdown}
                    dataKey="amount"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.category_breakdown.map((e: any) => (
                      <Cell key={e.category} fill={CATEGORY_COLORS[e.category] || '#6C63FF'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a26', border: '1px solid #3a3a50', borderRadius: 12 }}
                    formatter={(v: any) => [formatCurrency(v, data.currency), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.category_breakdown.map((c: any) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[c.category] || '#6C63FF' }} />
                      <span className="text-gray-400">{c.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{c.count} txns</span>
                      <span className="text-white font-medium">{formatCurrency(c.amount, data.currency)}</span>
                      <span className="text-gray-600 w-8 text-right">{c.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Merchants */}
            <Card>
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Top Merchants</h2>
              {data.merchant_breakdown?.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-8">No merchant data</p>
              )}
              <div className="space-y-3">
                {data.merchant_breakdown?.slice(0, 8).map((m: any, i: number) => (
                  <div key={m.merchant} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-4 font-mono">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate max-w-[140px]">{m.merchant}</span>
                        <span className="text-white font-medium">{formatCurrency(m.amount, data.currency)}</span>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(m.amount / data.merchant_breakdown[0].amount) * 100}%`,
                            background: `hsl(${(i * 47) % 360}, 65%, 58%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
