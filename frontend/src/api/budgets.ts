import client from './client'
import type { Budget } from '@/types'

export const budgetsApi = {
  list: (month: number, year: number) =>
    client.get<Budget[]>('/budgets', { params: { month, year } }).then(r => r.data),

  create: (data: Omit<Budget, 'id' | 'user_id' | 'spent' | 'percentage_used' | 'created_at'>) =>
    client.post<Budget>('/budgets', data).then(r => r.data),

  update: (id: string, data: { monthly_limit?: number; alert_threshold?: number }) =>
    client.patch<Budget>(`/budgets/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/budgets/${id}`),
}
