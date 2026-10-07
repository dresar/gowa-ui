import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Delete, Loader2, Lock } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConnection } from '@/stores/connection'
import { cn } from '@/lib/utils'

export default function ConnectPage() {
  const navigate = useNavigate()
  const status = useConnection((state) => state.status)
  const loginWithPin = useConnection((state) => state.loginWithPin)

  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (status === 'connected') {
    return <Navigate to="/" replace />
  }

  const submitPin = async (candidatePin: string) => {
    const cleanPin = candidatePin.trim()
    if (!cleanPin || submitting) return

    setSubmitting(true)
    setError(null)

    const res = await loginWithPin(cleanPin)
    setSubmitting(false)

    if (res.ok) {
      navigate('/', { replace: true })
    } else {
      setError(res.error || 'PIN salah, silakan coba lagi')
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
  }

  const handleDigit = (digit: string) => {
    setError(null)
    if (pin.length < 12) {
      const nextPin = pin + digit
      setPin(nextPin)
      if (nextPin.length === 6) {
        void submitPin(nextPin)
      }
    }
    inputRef.current?.focus()
  }

  const handleBackspace = () => {
    setError(null)
    setPin((prev) => prev.slice(0, -1))
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setError(null)
    setPin('')
    inputRef.current?.focus()
  }

  const handleFormSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    await submitPin(pin)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void submitPin(pin)
    }
  }

  const PIN_LENGTH = 6
  const dots = Array.from({ length: PIN_LENGTH })
  const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="ambient-glow bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4 select-none"
    >
      <div aria-hidden="true" className="grid-pattern pointer-events-none fixed inset-0 z-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-96 w-full max-w-4xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,oklch(0.64_0.25_25/25%),transparent_70%)] blur-2xl"
      />

      <Card className="glass-card border-border/70 relative z-10 w-full max-w-[360px] rounded-2xl shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute top-0 right-0 left-0 h-1 rounded-t-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 shadow-xs shadow-red-600/50" />

        <CardContent className="flex flex-col items-center gap-5 p-6 pt-7">
          <div className="flex flex-col items-center gap-3">
            <Logo className="[&_img]:size-9" />
            <div className="flex flex-col items-center text-center">
              <h1 className="text-foreground text-lg font-bold tracking-tight">Akses GoWA</h1>
              <p className="text-muted-foreground text-xs">Masukkan PIN keamanan untuk melanjutkan</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="flex w-full flex-col items-center gap-4">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '')
                if (clean.length <= 12) {
                  setError(null)
                  setPin(clean)
                  if (clean.length === 6) {
                    void submitPin(clean)
                  }
                }
              }}
              onKeyDown={handleKeyDown}
              className="sr-only"
              autoFocus
            />

            <div
              className={cn(
                'flex items-center justify-center gap-3 py-2 transition-transform duration-200',
                shake && 'animate-shake translate-x-0',
              )}
            >
              {dots.map((_, i) => {
                const filled = i < pin.length
                return (
                  <div
                    key={i}
                    className={cn(
                      'size-3.5 rounded-full transition-all duration-150',
                      filled
                        ? 'scale-110 bg-gradient-to-tr from-red-600 to-rose-500 shadow-sm shadow-red-500/60'
                        : 'border border-border/80 bg-muted/40',
                    )}
                  />
                )
              })}
            </div>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-center text-xs font-medium text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid w-full grid-cols-3 gap-2 pt-1">
              {keypadNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDigit(num)
                  }}
                  className="bg-card/60 hover:bg-accent/80 active:bg-accent border-border/60 text-foreground flex h-13 items-center justify-center rounded-xl border text-xl font-semibold transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="bg-card/40 hover:bg-accent/70 active:bg-accent border-border/50 text-muted-foreground flex h-13 items-center justify-center rounded-xl border text-xs font-semibold tracking-wider uppercase transition-all active:scale-95"
              >
                C
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDigit('0')
                }}
                className="bg-card/60 hover:bg-accent/80 active:bg-accent border-border/60 text-foreground flex h-13 items-center justify-center rounded-xl border text-xl font-semibold transition-all active:scale-95"
              >
                0
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBackspace()
                }}
                aria-label="Hapus digit"
                className="bg-card/40 hover:bg-accent/70 active:bg-accent border-border/50 text-muted-foreground flex h-13 items-center justify-center rounded-xl border transition-all active:scale-95"
              >
                <Delete className="size-5" />
              </button>
            </div>

            <Button
              type="submit"
              disabled={pin.length === 0 || submitting}
              className="mt-1 h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memverifikasi…</span>
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  <span>Masuk</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
