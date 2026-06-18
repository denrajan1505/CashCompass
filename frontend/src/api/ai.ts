import client from './client'
import type { ChatMessage, VoiceExpenseResult } from '@/types'

export const aiApi = {
  chat: (message: string, history: ChatMessage[]) =>
    client.post('/ai/chat', { message, history }).then(r => r.data),

  insights: (report_type: 'weekly' | 'monthly') =>
    client.post('/ai/insights', null, { params: { report_type } }).then(r => r.data),

  uploadVoice: (audioBlob: Blob, language: string) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'voice.webm')
    return client.post<VoiceExpenseResult>('/ai/voice', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { language },
    }).then(r => r.data)
  },

  uploadReceipt: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/receipts/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  processReceipt: (receiptId: string) =>
    client.post(`/receipts/${receiptId}/process`).then(r => r.data),
}
