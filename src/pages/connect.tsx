import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Globe, KeyRound, Loader2, Lock, ShieldCheck, User } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConnection, type TestResult } from '@/stores/connection'

const errorMessages: Record<Exclude<TestResult, 'ok'>, string> = {
  unauthorized: 'Credentials rejected (401 Unauthorized).',
  'not-gowa': 'Not an active GOWA server.',
  unreachable: 'Server unreachable. Verify backend is running.',
}

export default function ConnectPage() {
  const navigate = useNavigate()
  const status = useConnection((state) => state.status)
  const storedUrl = useConnection((state) => state.baseUrl)
  const storedUser = useConnection((state) => state.username)
  const connect = useConnection((state) => state.connect)

  const [url, setUrl] = useState(
    storedUrl ??
      (import.meta.env.VITE_DEFAULT_SERVER_URL as string | undefined) ??
      (typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'http://localhost:3000'),
  )
  const [username, setUsername] = useState(storedUser ?? '')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasAttemptedRef = useRef(false)

  useEffect(() => {
    if (hasAttemptedRef.current) return
    if (url && (status === 'unconfigured' || status === 'booting')) {
      hasAttemptedRef.current = true
      let active = true
      const tryAutoConnect = async () => {
        setSubmitting(true)
        const result = await connect(url)
        if (active) {
          setSubmitting(false)
          if (result === 'ok') {
            navigate('/', { replace: true })
          }
        }
      }
      void tryAutoConnect()
      return () => {
        active = false
      }
    }
  }, [url, status, connect, navigate])

  if (status === 'connected') return <Navigate to="/" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await connect(url, username || undefined, password || undefined)
    setSubmitting(false)
    if (result === 'ok') {
      navigate('/', { replace: true })
    } else {
      setError(errorMessages[result])
    }
  }

  const selectPreset = (presetUrl: string) => {
    setUrl(presetUrl)
  }

  return (
    <div className="ambient-glow bg-background relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Background # straight transparent grid lines across all pages */}
      <div aria-hidden="true" className="grid-pattern pointer-events-none fixed inset-0 z-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-96 w-full max-w-4xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,oklch(0.64_0.25_25/25%),transparent_70%)] blur-2xl"
      />

      <Card className="glass-card border-border/70 relative z-10 w-full max-w-md shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute top-0 right-0 left-0 h-1 rounded-t-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 shadow-xs shadow-red-600/50" />
        <CardHeader className="gap-2 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <Logo className="[&_img]:size-8" />
            <div className="flex items-center gap-1 rounded-md border border-red-500/30 bg-gradient-to-r from-red-500/15 to-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500 dark:text-red-400">
              <ShieldCheck className="size-3" />
              <span>TLS / LocalStorage</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-lg">Connect to GOWA Server</CardTitle>
            <CardDescription className="text-xs">
              Direct connection to your WhatsApp API instance. Credentials stay strictly in your
              browser.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="server-url" className="text-xs font-medium">
                  Server Endpoint URL
                </Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => selectPreset('http://localhost:3000')}
                    className="border-border/60 bg-muted/60 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] transition-all hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-500/15 hover:to-rose-500/10 hover:text-red-500"
                  >
                    :3000
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('http://localhost:5173/gowa')}
                    className="border-border/60 bg-muted/60 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] transition-all hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-500/15 hover:to-rose-500/10 hover:text-red-500"
                  >
                    /gowa
                  </button>
                </div>
              </div>
              <div className="relative flex items-center">
                <Globe className="text-muted-foreground absolute left-2.5 size-3.5" />
                <Input
                  id="server-url"
                  placeholder="http://localhost:3000"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="pl-8 font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-xs font-medium">
                  Username (optional)
                </Label>
                <div className="relative flex items-center">
                  <User className="text-muted-foreground absolute left-2.5 size-3.5" />
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="user"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password (optional)
                </Label>
                <div className="relative flex items-center">
                  <KeyRound className="text-muted-foreground absolute left-2.5 size-3.5" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-8 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-2.5 text-xs">
                {error}
              </div>
            )}
            {status === 'unauthorized' && !error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-2.5 text-xs">
                Credentials rejected. Re-enter credentials.
              </div>
            )}
            {status === 'unreachable' && !error && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                Server unreachable — verify GOWA backend is started on that port.
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !url.trim()}
              className="shadow-primary/20 mt-1 h-9 w-full gap-2 text-xs font-semibold shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Connect</span>
                </>
              )}
            </Button>

            <div className="text-muted-foreground/80 flex items-center justify-center gap-1.5 pt-1 text-[11px]">
              <Lock className="size-3 text-red-500" />
              <span>Token-based secure handshake</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
