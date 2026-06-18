import client from './client'
import type { Expense, ExpenseListResponse } from '@/types'

export interface CreateExpensePayload {
  amount: number
  currency: string
  category: string
  merchant?: string
  notes?: string
  tags?: string[]
  expense_date: string
  source?: string
}

export interface ExpenseFilters {
  category?: string
  currency?: string
  merchant?: string
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  search?: string
  page?: number
  per_page?: number
}

export const expensesApi = {
  list: (filters?: ExpenseFilters) =>
    client.get<ExpenseListResponse>('/expenses', { params: filters }).then(r => r.data),

  create: (data: CreateExpensePayload) =>
    client.post<Expense>('/expenses', data).then(r => r.data),

  update: (id: string, data: Partial<CreateExpensePayload>) =>
    client.patch<Expense>(`/expenses/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/expenses/${id}`),
}
