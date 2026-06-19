import { useEffect, useRef, useCallback } from 'react'

const IDLE_MS = 15 * 60 * 1000   // 15 minutes
const WARN_MS = 60 * 1000         // 60-second countdown

interface Options {
  onWarn: () => void
  onTimeout: () => void
  onActivity: () => void
  enabled: boolean
}

export function useIdleTimeout({ onWarn, onTimeout, onActivity, enabled }: Options) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warnTimer.current) clearTimeout(warnTimer.current)
  }, [])

  const reset = useCallback(() => {
    if (!enabled) return
    clear()
    onActivity()
    idleTimer.current = setTimeout(() => {
      onWarn()
      warnTimer.current = setTimeout(onTimeout, WARN_MS)
    }, IDLE_MS)
  }, [enabled, clear, onWarn, onTimeout, onActivity])

  useEffect(() => {
    if (!enabled) { clear(); return }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      clear()
    }
  }, [enabled, reset, clear])
}
