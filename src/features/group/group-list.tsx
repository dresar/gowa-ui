import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, LogOut, Plus, RefreshCw, Search, Smartphone, Users } from 'lucide-react'
import { toast } from 'sonner'
import { leaveGroup, listMyGroups, type MyGroup } from '@/api/group'
import { EmptyState } from '@/components/shared/empty-state'
import { IdText } from '@/components/shared/id-text'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ErrorNotice } from '@/components/shared/error-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { isDeviceNotFoundError, toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'

/** Strip the @server suffix from a JID for compact display. */
function shortId(jid: string): string {
  return jid.split('@')[0]
}

export function GroupDirectory({ onSelect }: { onSelect: (group: MyGroup) => void }) {
  const deviceId = useSelectedDevice()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [leaveTarget, setLeaveTarget] = useState<MyGroup | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const {
    data: groups,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['groups', deviceId],
    queryFn: () => listMyGroups(deviceId || undefined),
    enabled: !!deviceId,
  })

  const leave = useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      toast.success(`Left ${leaveTarget?.Name || 'group'}`)
      setLeaveTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (mutationError) => toast.error(toApiError(mutationError).message),
  })

  const filtered = useMemo(() => {
    if (!groups) return []
    const term = search.trim().toLowerCase()
    if (!term) return groups
    return groups.filter(
      (group) => group.Name.toLowerCase().includes(term) || group.JID.toLowerCase().includes(term),
    )
  }, [groups, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            className="pl-8"
            placeholder="Cari"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
          Perbarui
        </Button>
      </div>

      {error && isDeviceNotFoundError(error) ? (
        <EmptyState
          icon={Smartphone}
          title="Perangkat tidak ditemukan"
          hint="Sesi WhatsApp yang dipilih tidak tersedia. Silakan pilih perangkat aktif atau daftarkan baru."
          action={
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Tambah</span>
            </Button>
          }
        />
      ) : error ? (
        <ErrorNotice
          title="Gagal memuat grup"
          error={error}
          onRetry={() => refetch()}
        />
      ) : null}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {groups && groups.length === 0 && (
        <EmptyState
          icon={Users}
          title="Belum ada grup"
          hint="Buat grup atau gabung melalui tautan undangan."
        />
      )}

      {groups && groups.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="Tidak ditemukan" hint={`Tidak ada yang cocok dengan "${search}".`} />
      )}

      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((group) => (
            <Card key={group.JID} className="card-lift cursor-pointer gap-0 py-0">
              <CardContent
                className="flex items-center gap-3 p-4"
                onClick={() => onSelect(group)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(group)
                  }
                }}
              >
                <div className="bg-accent font-heading text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
                  {(group.Name || '#').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{group.Name || shortId(group.JID)}</p>
                  <IdText value={shortId(group.JID)} />
                  <p className="text-muted-foreground text-xs">
                    {group.Participants?.length ?? group.ParticipantCount ?? 0} anggota ·{' '}
                    {formatDate(group.GroupCreated)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Keluar dari ${group.Name || 'grup'}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    setLeaveTarget(group)
                  }}
                >
                  <LogOut className="size-4" />
                </Button>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!leaveTarget} onOpenChange={(open) => !open && setLeaveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari {leaveTarget?.Name || 'grup ini'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan dikeluarkan dari grup. Untuk bergabung kembali memerlukan undangan baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveTarget && leave.mutate({ group_id: leaveTarget.JID })}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
