import client from './client'
import type { User } from '@/types'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  user: User
}

export const authApi = {
  register: (data: { full_name: string; email: string; password: string }) =>
    client.post<TokenResponse>('/auth/register', data).then(r => r.data),

  login: (data: { email: string; password: string }) =>
    client.post<TokenResponse>('/auth/login', data).then(r => r.data),

  me: () => client.get<User>('/auth/me').then(r => r.data),

  updateProfile: (data: Partial<User>) =>
    client.patch<User>('/auth/me', data).then(r => r.data),

  forgotPassword: (email: string) =>
    client.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    client.post('/auth/reset-password', { token, new_password }),
}
