import { useTheme } from 'next-themes'
import { CheckCircle2, Globe, LogOut, Moon, Server, Sun, Laptop } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppInfo } from '@/hooks/use-app-info'
import { formatBytes } from '@/lib/format'
import { useConnection } from '@/stores/connection'

export default function SettingsPage() {
  const baseUrl = useConnection((state) => state.baseUrl)
  const username = useConnection((state) => state.username)
  const disconnect = useConnection((state) => state.disconnect)
  const { data: info, isLoading: infoLoading, error: infoError } = useAppInfo()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader
        title="Pengaturan"
        description="Konfigurasi gateway."
      />

      <Card className="glass-card rounded-xl backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-red-500 dark:text-red-400" />
              Koneksi Gateway
            </CardTitle>
            <span className="flex items-center gap-1 rounded-md border border-red-500/30 bg-gradient-to-r from-red-500/15 to-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500 dark:text-red-400">
              <CheckCircle2 className="size-3" />
              Terhubung
            </span>
          </div>
          <CardDescription className="text-xs">
            Endpoint REST dan WebSocket dashboard ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-xs">
          <div className="border-border/50 bg-muted/30 flex items-center justify-between gap-4 rounded-lg border p-2.5">
            <span className="text-muted-foreground font-medium">URL Server</span>
            <span className="text-foreground truncate font-mono">{baseUrl}</span>
          </div>
          <div className="border-border/50 bg-muted/30 flex items-center justify-between gap-4 rounded-lg border p-2.5">
            <span className="text-muted-foreground font-medium">Pengguna Auth</span>
            <span className="text-foreground font-mono">{username || '— (Tanpa autentikasi)'}</span>
          </div>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 h-8 gap-1.5"
            >
              <LogOut className="size-3.5" />
              Putuskan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Server className="size-4 text-red-500 dark:text-red-400" />
            Arsitektur Server
          </CardTitle>
          <CardDescription className="text-xs">
            Info dari GET /app/info
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 text-xs">
          {infoLoading && <Skeleton className="h-20 rounded-lg" />}
          {infoError && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3">
              Gagal memuat info server.
            </div>
          )}
          {info && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="border-border/50 bg-muted/30 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Versi</span>
                <p className="text-foreground font-mono font-semibold">{info.version}</p>
              </div>
              <div className="border-border/50 bg-muted/30 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Sistem Operasi</span>
                <p className="text-foreground font-mono font-semibold">{info.os}</p>
              </div>
              <div className="border-border/50 bg-muted/30 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Ukuran Unggah Maks</span>
                <p className="text-foreground font-mono font-semibold">
                  {formatBytes(info.max_video_size)}
                </p>
              </div>
              <div className="border-border/50 bg-muted/30 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Kirim Terjadwal</span>
                <p className="font-semibold text-red-500 dark:text-red-400">
                  {info.scheduled_sends ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sun className="size-4 text-red-500 dark:text-red-400" />
            Tampilan
          </CardTitle>
          <CardDescription className="text-xs">
            Mode terang atau gelap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-xs flex-col gap-1.5">
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="size-3.5" />
                    <span>Gelap</span>
                  </div>
                </SelectItem>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="size-3.5" />
                    <span>Terang</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Laptop className="size-3.5" />
                    <span>Sistem</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
