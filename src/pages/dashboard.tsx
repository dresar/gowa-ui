import { useMemo, useState } from 'react'
import { CheckCircle2, Plus, Radio, Search, Smartphone, Unplug } from 'lucide-react'
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
  const connecting =
    devices?.filter((d) => d.state === 'connecting' || d.state === 'connected').length ?? 0
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
            'glass-card card-lift flex items-center gap-3 rounded-xl p-3.5 text-left backdrop-blur-xl transition-all',
            filter === 'all' &&
              'border-red-500/60 bg-gradient-to-br from-red-500/15 via-rose-500/8 to-transparent shadow-md ring-1 shadow-red-500/15 ring-red-500/40',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-500/35 bg-gradient-to-br from-red-500/20 via-rose-500/15 to-transparent text-red-500 shadow-2xs dark:text-red-400">
            <Smartphone className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-medium">Total Slots</p>
            <p className="font-heading text-foreground text-lg font-bold tracking-tight">{total}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('logged_in')}
          className={cn(
            'glass-card card-lift flex items-center gap-3 rounded-xl p-3.5 text-left backdrop-blur-xl transition-all',
            filter === 'logged_in' && 'border-emerald-500/50 ring-1 ring-emerald-500/30',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-medium">Logged In</p>
            <p className="font-heading text-lg font-bold tracking-tight text-emerald-500">
              {loggedIn}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('connecting')}
          className={cn(
            'glass-card card-lift flex items-center gap-3 rounded-xl p-3.5 text-left backdrop-blur-xl transition-all',
            filter === 'connecting' && 'border-amber-500/50 ring-1 ring-amber-500/30',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-2xs">
            <Radio className="size-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-medium">Connecting</p>
            <p className="font-heading text-lg font-bold tracking-tight text-amber-500">
              {connecting}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('disconnected')}
          className={cn(
            'glass-card card-lift flex items-center gap-3 rounded-xl p-3.5 text-left backdrop-blur-xl transition-all',
            filter === 'disconnected' &&
              'border-muted-foreground/50 ring-muted-foreground/30 ring-1',
          )}
        >
          <div className="border-border/60 bg-muted/40 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
            <Unplug className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-medium">Offline</p>
            <p className="font-heading text-muted-foreground text-lg font-bold tracking-tight">
              {disconnected}
            </p>
          </div>
        </button>
      </div>

      {devices && devices.length > 0 && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices by name, phone or ID…"
              className="h-8.5 rounded-lg pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                filter === 'all'
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 font-semibold text-white shadow-xs shadow-red-600/30'
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
                  ? 'border border-emerald-500/40 bg-emerald-500/20 font-semibold text-emerald-400 shadow-xs'
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
                  ? 'border border-amber-500/40 bg-amber-500/20 font-semibold text-amber-400 shadow-xs'
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
                  ? 'border-border/80 bg-muted/80 text-foreground border font-semibold shadow-xs'
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
          <CardContent className="text-destructive py-3 text-xs">
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
        <Card className="border-border/70 bg-card/60 border shadow-xs backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:py-12">
            <div className="border-primary/25 bg-primary/10 text-primary relative flex size-14 items-center justify-center rounded-xl border shadow-md">
              <Smartphone className="size-7" />
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-primary relative inline-flex size-3 rounded-full" />
              </span>
            </div>

            <div className="flex max-w-md flex-col gap-1.5">
              <h2 className="font-heading text-foreground text-base font-bold tracking-tight sm:text-lg">
                No WhatsApp Devices Registered
              </h2>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Provision a session slot to begin pairing physical phones, automating broadcasts,
                and synchronizing contacts.
              </p>
            </div>

            <div className="grid w-full max-w-xl gap-2.5 text-left sm:grid-cols-3">
              <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
                <div className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="bg-primary/20 text-primary flex size-4 items-center justify-center rounded text-[10px] font-bold">
                    1
                  </span>
                  <span>Register Slot</span>
                </div>
                <p className="text-muted-foreground mt-1 text-[10px] leading-normal">
                  Allocate an isolated WhatsApp Multi-Device session container.
                </p>
              </div>
              <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
                <div className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="bg-primary/20 text-primary flex size-4 items-center justify-center rounded text-[10px] font-bold">
                    2
                  </span>
                  <span>Pair Phone</span>
                </div>
                <p className="text-muted-foreground mt-1 text-[10px] leading-normal">
                  Scan dynamic QR code or use WhatsApp pairing code.
                </p>
              </div>
              <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
                <div className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="bg-primary/20 text-primary flex size-4 items-center justify-center rounded text-[10px] font-bold">
                    3
                  </span>
                  <span>Broadcast & Stream</span>
                </div>
                <p className="text-muted-foreground mt-1 text-[10px] leading-normal">
                  Dispatch messages, receive webhooks, and manage groups.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-1 h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Register First Device</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {devices && devices.length > 0 && filteredDevices.length === 0 && (
        <div className="border-border/70 bg-card/60 flex flex-col items-center justify-center gap-2 rounded-xl border p-10 text-center backdrop-blur-xl">
          <p className="text-foreground text-xs font-semibold">No matching devices</p>
          <p className="text-muted-foreground text-[11px]">
            Try clearing your search query or status filter.
          </p>
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
