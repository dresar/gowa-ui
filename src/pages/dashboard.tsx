import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Plus,
  Radio,
  Search,
  Smartphone,
  Unplug,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { DeviceCard } from '@/features/devices/device-card'
import { LoginCodeDialog } from '@/features/session/login-code-dialog'
import { LoginQrDialog } from '@/features/session/login-qr-dialog'
import { useDevices } from '@/hooks/use-devices'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import type { DeviceState, RegistryDevice } from '@/api/types'

type FilterState = 'all' | DeviceState

export default function DashboardPage() {
  const { data: devices, isLoading, error } = useDevices()
  const [filter, setFilter] = useState<FilterState>('all')
  const [search, setSearch] = useState('')
  const [qrDevice, setQrDevice] = useState<RegistryDevice | null>(null)
  const [codeDevice, setCodeDevice] = useState<RegistryDevice | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const total = devices?.length ?? 0
  const loggedIn = devices?.filter((d) => d.state === 'logged_in').length ?? 0
  const connecting = devices?.filter((d) => d.state === 'connecting' || d.state === 'connected').length ?? 0
  const disconnected = devices?.filter((d) => d.state === 'disconnected').length ?? 0

  const filteredDevices = useMemo(() => {
    if (!devices) return []
    return devices.filter((d) => {
      const matchFilter =
        filter === 'all'
          ? true
          : filter === 'connecting'
            ? d.state === 'connecting' || d.state === 'connected'
            : d.state === filter
      const matchSearch =
        !search.trim() ||
        (d.display_name && d.display_name.toLowerCase().includes(search.toLowerCase())) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        (d.phone_number && d.phone_number.includes(search)) ||
        (d.jid && d.jid.toLowerCase().includes(search.toLowerCase()))
      return matchFilter && matchSearch
    })
  }, [devices, filter, search])

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PageHeader
        title="WhatsApp Devices"
        description="Multi-device session orchestration and telemetry."
        actions={
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Device</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'glass-card flex items-center gap-3 rounded-xl p-3.5 text-left transition-all backdrop-blur-xl',
            filter === 'all' && 'border-primary/50 ring-1 ring-primary/30',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card/60 text-primary shadow-2xs">
            <Smartphone className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Total Slots</p>
            <p className="font-heading text-lg font-bold tracking-tight text-foreground">{total}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('logged_in')}
          className={cn(
            'glass-card flex items-center gap-3 rounded-xl p-3.5 text-left transition-all backdrop-blur-xl',
            filter === 'logged_in' && 'border-emerald-500/50 ring-1 ring-emerald-500/30',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Logged In</p>
            <p className="font-heading text-lg font-bold tracking-tight text-emerald-500">{loggedIn}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('connecting')}
          className={cn(
            'glass-card flex items-center gap-3 rounded-xl p-3.5 text-left transition-all backdrop-blur-xl',
            filter === 'connecting' && 'border-amber-500/50 ring-1 ring-amber-500/30',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-2xs">
            <Radio className="size-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Connecting</p>
            <p className="font-heading text-lg font-bold tracking-tight text-amber-500">{connecting}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('disconnected')}
          className={cn(
            'glass-card flex items-center gap-3 rounded-xl p-3.5 text-left transition-all backdrop-blur-xl',
            filter === 'disconnected' && 'border-muted-foreground/50 ring-1 ring-muted-foreground/30',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground shadow-2xs">
            <Unplug className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Offline</p>
            <p className="font-heading text-lg font-bold tracking-tight text-muted-foreground">{disconnected}</p>
          </div>
        </button>
      </div>

      {devices && devices.length > 0 && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices by name, phone or ID…"
              className="h-8.5 pl-8 text-xs rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              All ({total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('logged_in')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                filter === 'logged_in'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Online ({loggedIn})
            </button>
            <button
              type="button"
              onClick={() => setFilter('connecting')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                filter === 'connecting'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Syncing ({connecting})
            </button>
            <button
              type="button"
              onClick={() => setFilter('disconnected')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                filter === 'disconnected'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Offline ({disconnected})
            </button>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-3 text-xs text-destructive">
            Failed to load devices: {toApiError(error).message}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      )}

      {devices && devices.length === 0 && (
        <EmptyState
          icon={Smartphone}
          title="No WhatsApp devices registered"
          hint="Create a new device slot above, then link your phone via QR scan or WhatsApp pairing code."
          action={
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="mt-2 h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              <span>Register First Device</span>
            </Button>
          }
        />
      )}

      {devices && devices.length > 0 && filteredDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 p-10 text-center backdrop-blur-xl">
          <p className="text-xs font-semibold text-foreground">No matching devices</p>
          <p className="text-[11px] text-muted-foreground">Try clearing your search query or status filter.</p>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setFilter('all')
              setSearch('')
            }}
            className="mt-1 h-7 rounded-[6px] text-xs font-medium"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {filteredDevices.length > 0 && (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onLoginQr={setQrDevice}
              onLoginCode={setCodeDevice}
            />
          ))}
        </div>
      )}

      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <LoginQrDialog device={qrDevice} onOpenChange={(open) => !open && setQrDevice(null)} />
      <LoginCodeDialog device={codeDevice} onOpenChange={(open) => !open && setCodeDevice(null)} />
    </div>
  )
}
