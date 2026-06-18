import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Edit2, Filter, Mic } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { expensesApi, type CreateExpensePayload } from '@/api/expenses'
import { CATEGORIES, CURRENCIES, CATEGORY_COLORS } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils/formatters'

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateExpensePayload>({
    defaultValues: { currency: 'INR', category: 'Other', expense_date: new Date().toISOString().slice(0, 10) },
  })

  const create = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Expense added!'); reset(); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to add'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount" type="number" step="0.01" placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount', { required: 'Required', valueAsNumber: true, min: { value: 0.01, message: 'Must be > 0' } })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Currency</label>
            <select className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('currency')}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Category</label>
          <select className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <Input label="Merchant" placeholder="e.g. Swiggy, Uber..." {...register('merchant')} />
        <Input label="Date" type="date" {...register('expense_date', { required: 'Required' })} error={errors.expense_date?.message} />
        <Input label="Notes (optional)" placeholder="Any details..." {...register('notes')} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={create.isPending}>Add Expense</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ExpenseList() {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { search, category, page }],
    queryFn: () => expensesApi.list({ search: search || undefined, category: category || undefined, page, per_page: 20 }),
  })

  const del = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Deleted') },
  })

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.total || 0} total transactions</p>
        </div>
        <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search expenses..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="flex-1"
          />
          <select
            className="bg-dark-700 border border-dark-400 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px]"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1) }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      {/* List */}
      <Card>
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No expenses found. Add your first one!</p>
          </div>
        )}

        <div className="space-y-1">
          {data?.items.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-700 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium"
                  style={{ background: (CATEGORY_COLORS[e.category] || '#6C63FF') + '20', color: CATEGORY_COLORS[e.category] || '#6C63FF' }}>
                  {e.category[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{e.merchant || e.category}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formatDate(e.expense_date)}</span>
                    <Badge variant="default" className="text-[10px]">{e.category}</Badge>
                    {e.source !== 'manual' && <Badge variant="purple" className="text-[10px]">{e.source}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">{formatCurrency(e.amount, e.currency)}</span>
                <button
                  onClick={() => del.mutate(e.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-dark-600 mt-4">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-gray-500">{page} / {data.total_pages}</span>
            <Button variant="ghost" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
