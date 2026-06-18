export interface User {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  preferred_currency: string
  preferred_language: string
  subscription_status: 'free' | 'pro' | 'premium'
  is_verified: boolean
  is_admin: boolean
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  currency: string
  amount_in_base?: number
  category: string
  merchant?: string
  notes?: string
  tags: string[]
  expense_date: string
  source: 'manual' | 'voice' | 'receipt'
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  monthly_limit: number
  currency: string
  alert_threshold: number
  month: number
  year: number
  spent: number
  percentage_used: number
  created_at: string
}

export interface Receipt {
  id: string
  user_id: string
  image_url: string
  extracted_data?: ExtractedReceiptData
  status: 'pending' | 'processed' | 'failed'
  created_at: string
}

export interface ExtractedReceiptData {
  merchant?: string
  amount?: number
  currency?: string
  date?: string
  category?: string
  items?: { name: string; price: number }[]
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  count: number
}

export interface DailySpending {
  date: string
  amount: number
}

export interface DashboardMetrics {
  total_this_month: number
  total_last_month: number
  change_percent: number
  currency: string
  top_category?: string
  total_expenses_count: number
  daily_spending: DailySpending[]
  category_breakdown: CategoryBreakdown[]
  recent_expenses: RecentExpense[]
}

export interface RecentExpense {
  id: string
  amount: number
  currency: string
  category: string
  merchant?: string
  date: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface VoiceExpenseResult {
  transcript: string
  amount?: number
  currency?: string
  category?: string
  merchant?: string
  notes?: string
  confidence: number
}

export interface ExpenseListResponse {
  items: Expense[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Health & Medical', 'Utilities', 'Housing', 'Education',
  'Travel', 'Personal Care', 'Investments', 'Insurance',
  'Gifts & Donations', 'Business', 'Other',
]

export const CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF',
  'HKD', 'NZD', 'SEK', 'KRW', 'MXN', 'NOK', 'THB', 'MYR', 'IDR', 'PHP',
  'CNY', 'SAR', 'QAR', 'KWD', 'BRL', 'ZAR', 'EGP', 'PKR', 'BDT', 'LKR',
]

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f97316',
  'Transportation': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Health & Medical': '#10b981',
  'Utilities': '#f59e0b',
  'Housing': '#6366f1',
  'Education': '#14b8a6',
  'Travel': '#06b6d4',
  'Personal Care': '#e11d48',
  'Investments': '#22c55e',
  'Insurance': '#64748b',
  'Gifts & Donations': '#a855f7',
  'Business': '#0ea5e9',
  'Other': '#94a3b8',
}
