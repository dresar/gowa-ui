import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleUserRound,
  LayoutDashboard,
  Plus,
  QrCode,
  Smartphone,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { StateBadge } from '@/features/devices/state-badge'
import { LoginQrDialog } from '@/features/session/login-qr-dialog'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { useDevices } from '@/hooks/use-devices'
import { useDeviceStore } from '@/stores/device'
import type { RegistryDevice } from '@/api/types'

function GuardDeviceCard({
  device,
  onSelect,
  onPair,
}: {
  device: RegistryDevice
  onSelect: (id: string) => void
  onPair: (device: RegistryDevice) => void
}) {
  const avatar = useDeviceAvatar(device)

  return (
    <Card className="card-lift border-border/70 bg-card/70 backdrop-blur-xl shadow-xs transition-all">
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3.5 pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10 border border-border/80 shadow-2xs">
            {avatar.data?.url && (
              <AvatarImage src={avatar.data.url} alt={device.display_name || device.id} />
            )}
            <AvatarFallback className="bg-muted/50">
              <CircleUserRound className="size-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {device.display_name || device.id}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {device.phone_number || device.jid || device.id}
            </p>
          </div>
        </div>
        <StateBadge state={device.state} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-3.5 pt-0">
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            size="sm"
            onClick={() => onSelect(device.id)}
            className="h-8 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
          >
            <span>Use Device</span>
          </Button>
          {device.state !== 'logged_in' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPair(device)}
              className="h-8 gap-1 rounded-[6px] border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-[0.98]"
            >
              <QrCode className="size-3.5" />
              <span>Pair QR</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(device.id)}
              className="h-8 rounded-[6px] border-border/70 bg-muted/40 text-xs font-semibold text-foreground hover:bg-muted/60 active:scale-[0.98]"
            >
              <span>Connect</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DeviceGuard() {
  const { data: devices, isLoading } = useDevices()
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const [createOpen, setCreateOpen] = useState(false)
  const [qrDevice, setQrDevice] = useState<RegistryDevice | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    )
  }

  if (devices && devices.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="border-border/70 bg-card/60 backdrop-blur-xl shadow-xs">
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-2xs">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold sm:text-base">
                    Select Active WhatsApp Session
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose a registered device below to run device-scoped operations on this page.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="h-8 gap-1.5 self-start rounded-lg border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10 sm:self-auto"
              >
                <Plus className="size-3.5" />
                <span>New Device Slot</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <GuardDeviceCard
              key={device.id}
              device={device}
              onSelect={selectDevice}
              onPair={setQrDevice}
            />
          ))}
        </div>

        <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
        <LoginQrDialog device={qrDevice} onOpenChange={(open) => !open && setQrDevice(null)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/70 bg-card/60 backdrop-blur-xl shadow-xs">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:py-12">
          <div className="relative flex size-14 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-md">
            <Smartphone className="size-7" />
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          </div>

          <div className="flex max-w-md flex-col gap-1.5">
            <h2 className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg">
              No WhatsApp Devices Connected
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This section requires an active WhatsApp session to read contacts, profile identity, and message streams.
            </p>
          </div>

          <div className="grid w-full max-w-xl gap-2.5 sm:grid-cols-3 text-left">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <span className="flex size-4 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">1</span>
                <span>Register Slot</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground leading-normal">
                Create a session slot on the Go backend server.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <span className="flex size-4 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">2</span>
                <span>Pair Phone</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground leading-normal">
                Scan QR code or use WhatsApp pairing code.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <span className="flex size-4 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">3</span>
                <span>Ready to Use</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground leading-normal">
                Broadcast messages, read chats, and edit identity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Register Device Slot</span>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-8 gap-1.5 rounded-lg border-border/70 text-xs font-semibold"
            >
              <Link to="/">
                <LayoutDashboard className="size-3.5" />
                <span>Go to Devices Overview</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

export function useSelectedDevice(): string | null {
  return useDeviceStore((state) => state.selectedDeviceId)
}
