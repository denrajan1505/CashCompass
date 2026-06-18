import { useState, useRef } from 'react'
import { Upload, Camera, FileImage, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiApi } from '@/api/ai'
import client from '@/api/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import type { ExtractedReceiptData } from '@/types'

export default function ReceiptScanner() {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractedReceiptData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isPro = user?.subscription_status !== 'free' || user?.is_admin

  const trialDaysLeft = (() => {
    if (isPro) return null
    if (!user?.created_at) return 3  // unknown date → give benefit of the doubt
    const created = new Date(user.created_at)
    const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, 3 - days)
  })()
  const [creating, setCreating] = useState(false)

  async function createExpense() {
    if (!result) return
    setCreating(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const itemsNote = result.items && result.items.length > 0
        ? '\nItems: ' + result.items.map(i => `${i.name} (${result.currency || 'INR'} ${i.price})`).join(', ')
        : ''
      await client.post('/expenses', {
        amount: result.amount,
        currency: result.currency || 'INR',
        category: result.category || 'Other',
        merchant: result.merchant,
        expense_date: result.date || today,
        source: 'receipt',
        notes: `Receipt from ${result.merchant || 'scan'}${itemsNote}`,
      })
      toast.success('Expense created!')
      window.location.href = '/expenses'
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to create expense')
    } finally {
      setCreating(false)
    }
  }

  async function handleFile(file: File) {
    if (!isPro && trialDaysLeft === 0) { toast.error('Your 3-day free trial has ended. Upgrade to Pro!'); return }
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setUploading(true)
    try {
      const receipt = await aiApi.uploadReceipt(file)
      setReceiptId(receipt.id)
      toast.success('Receipt uploaded!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  async function processReceipt() {
    if (!receiptId) return
    setProcessing(true)
    try {
      const data = await aiApi.processReceipt(receiptId)
      setResult(data)
      toast.success('Receipt processed!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (!isPro && trialDaysLeft === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Receipt Scanner</h1>
        <Card className="text-center py-16">
          <FileImage className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Free Trial Ended</h2>
          <p className="text-gray-500 mb-6">Your 3-day free trial has ended. Upgrade to Pro to continue scanning receipts.</p>
          <Button onClick={() => window.location.href = '/subscription'}>Upgrade to Pro — ₹499/month</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Receipt Scanner</h1>
          {!isPro && trialDaysLeft !== null && trialDaysLeft > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} free trial left
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-0.5">AI-powered OCR via Google Gemini</p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-dark-500 hover:border-primary-500/50 rounded-2xl p-12 text-center cursor-pointer transition-all group"
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Receipt" className="max-h-48 mx-auto rounded-xl object-contain" />
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading…</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-gray-600 group-hover:text-primary-400 mx-auto mb-3 transition-colors" />
            <p className="text-gray-400 font-medium">Drop receipt here or click to upload</p>
            <p className="text-gray-600 text-sm mt-1">JPEG, PNG, WebP up to 10 MB</p>
          </div>
        )}
      </div>

      {/* Process Button */}
      {receiptId && !result && (
        <Button className="w-full" size="lg" onClick={processReceipt} loading={processing}
          leftIcon={<Camera className="w-4 h-4" />}>
          Extract with AI
        </Button>
      )}

      {/* Results */}
      {result && (
        <Card className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Extracted Data</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Merchant', value: result.merchant },
              { label: 'Amount', value: result.amount ? `${result.currency || 'INR'} ${result.amount}` : null },
              { label: 'Date', value: result.date },
              { label: 'Category', value: result.category },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-white mt-0.5">{value || '—'}</p>
              </div>
            ))}
          </div>

          {result.items && result.items.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Line Items</p>
              <div className="space-y-1">
                {result.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">{item.name}</span>
                    <span className="text-white">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={createExpense} loading={creating} disabled={!result.amount}>
            Create Expense from Receipt
          </Button>
        </Card>
      )}
    </div>
  )
}
