import client from './client'
import type { DashboardMetrics } from '@/types'

export const analyticsApi = {
  dashboard: () =>
    client.get<DashboardMetrics>('/analytics/dashboard').then(r => r.data),

  report: (month: number, year: number) =>
    client.get('/analytics/report', { params: { month, year } }).then(r => r.data),
}
