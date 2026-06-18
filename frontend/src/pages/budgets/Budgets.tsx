import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { budgetsApi } from '@/api/budgets'
import { CATEGORIES } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import { formatCurrency, getMonthName } from '@/utils/formatters'
import type { Budget } from '@/types'

function BudgetCard({ budget, onDelete }: { budget: Budget; onDelete: () => void }) {
  const pct = Math.min(budget.percentage_used, 100)
  const isAlert = budget.percentage_used >= budget.alert_threshold
  const isOver = budget.percentage_used >= 100

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{budget.category}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatCurrency(budget.spent, budget.currency)} / {formatCurrency(budget.monthly_limit, budget.currency)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAlert && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          <button onClick={onDelete} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : isAlert ? 'bg-amber-500' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className={`text-xs font-medium ${isOver ? 'text-red-400' : isAlert ? 'text-amber-400' : 'text-gray-500'}`}>
          {budget.percentage_used.toFixed(0)}% used
        </span>
        <span className="text-xs text-gray-600">Alert at {budget.alert_threshold}%</span>
      </div>
    </Card>
  )
}

export default function Budgets() {
  const [showAdd, setShowAdd] = useState(false)
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const qc = useQueryClient()

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => budgetsApi.list(month, year),
  })

  const del = useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget deleted') },
  })

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { category: 'Food & Dining', monthly_limit: 5000, currency: 'INR', alert_threshold: 80, month, year },
  })

  const create = useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget created!'); reset(); setShowAdd(false) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const totalBudget = budgets.reduce((s, b) => s + Number(b.monthly_limit), 0)
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budgets</h1>
          <p className="text-gray-500 text-sm">{getMonthName(month)} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-dark-700 border border-dark-400 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            value={month} onChange={e => setMonth(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>Set Budget</Button>
        </div>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Overall Budget Usage</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(totalSpent, 'INR')} / {formatCurrency(totalBudget, 'INR')}
            </span>
          </div>
          <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-dark-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && budgets.length === 0 && (
        <Card className="text-center py-16">
          <p className="text-gray-500 mb-4">No budgets set for this month.</p>
          <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>Create First Budget</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(b => (
          <BudgetCard key={b.id} budget={b} onDelete={() => del.mutate(b.id)} />
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Set Monthly Budget">
        <form onSubmit={handleSubmit(d => create.mutate(d as any))} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Category</label>
            <select className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Monthly Limit</label>
              <input type="number" step="100" className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('monthly_limit', { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Alert at (%)</label>
              <input type="number" min="1" max="100" className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('alert_threshold', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={create.isPending}>Save Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
