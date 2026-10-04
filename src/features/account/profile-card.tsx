import { useState } from 'react'
import { Check, CircleUserRound, Copy, ShieldCheck, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StateBadge } from '@/features/devices/state-badge'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { useDevices } from '@/hooks/use-devices'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { formatDate } from '@/lib/format'

export function MyProfileCard() {
  const deviceId = useSelectedDevice()
  const { data: devices } = useDevices()
  const device = devices?.find((item) => item.id === deviceId)
  const avatar = useDeviceAvatar(device)
  const [copied, setCopied] = useState(false)

  const copyJid = () => {
    if (!device?.jid && !device?.phone_number) return
    const text = device.jid || device.phone_number || ''
    void navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('JID copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/70 bg-card/70 backdrop-blur-xl shadow-xs">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-16 border-2 border-border/80 shadow-xs sm:size-18">
              {avatar.data?.url && <AvatarImage src={avatar.data.url} alt="My avatar" />}
              <AvatarFallback className="bg-muted/50">
                {avatar.isLoading ? (
                  <Skeleton className="size-full rounded-full" />
                ) : (
                  <CircleUserRound className="size-8 text-muted-foreground" />
                )}
              </AvatarFallback>
            </Avatar>
            {device?.state === 'logged_in' && (
              <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-base font-bold text-foreground sm:text-lg">
                {device?.display_name || 'No push name configured'}
              </h2>
              {device && <StateBadge state={device.state} />}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {device?.phone_number || device?.jid || 'Unpaired session'}
              </span>
              {(device?.jid || device?.phone_number) && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={copyJid}
                  className="h-5 gap-1 rounded px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Smartphone className="size-3 text-primary" />
                <span>Slot: <span className="font-mono text-foreground">{deviceId}</span></span>
              </div>
              {device?.created_at && (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-500" />
                  <span>Created {formatDate(device.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
