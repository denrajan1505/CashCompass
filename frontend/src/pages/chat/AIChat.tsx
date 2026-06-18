import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Bot, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { aiApi } from '@/api/ai'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { ChatMessage } from '@/types'

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What is my biggest expense category?',
  'Compare my spending with last month',
  'How much can I save this month?',
  'Give me tips to reduce food expenses',
  'What is my daily average spending?',
]

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m your CashCompass AI assistant. Ask me anything about your finances — spending patterns, savings tips, budget advice, and more!' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-10)
      const res = await aiApi.chat(msg, history)
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }])
    } catch (e: any) {
      const err = e.response?.data?.detail || 'AI temporarily unavailable'
      toast.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't process that: ${err}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Finance Chat</h1>
          <p className="text-gray-500 text-xs">Powered by GPT-4o · Understands your spending data</p>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-left p-3 bg-dark-800 border border-dark-500 hover:border-primary-500/50 rounded-xl text-xs text-gray-400 hover:text-white transition-all">
              <Lightbulb className="w-3.5 h-3.5 text-primary-400 mb-1" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary-500/20' : 'bg-dark-600'}`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4 text-primary-400" />
                  : <User className="w-4 h-4 text-gray-400" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-dark-800 border border-dark-500 text-gray-200'
                  : 'bg-primary-500 text-white'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-400" />
            </div>
            <div className="bg-dark-800 border border-dark-500 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 pt-4 border-t border-dark-600">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your finances..."
          className="flex-1 bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <Button onClick={() => send()} disabled={!input.trim() || loading} size="md">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
