import { useEffect, useRef, useState } from 'react'
import {
  Blocks,
  Bot,
  CalendarClock,
  LayoutDashboard,
  Loader2,
  Lock,
  Menu,
  MessagesSquare,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { DeviceSwitcher } from '@/components/layout/device-switcher'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { WsBadge } from '@/components/layout/ws-badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PasskeyDialog } from '@/features/session/passkey-dialog'
import { useDevices } from '@/hooks/use-devices'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'

const navGroups = [
  {
    label: 'Ringkasan',
    items: [{ to: '/', label: 'Perangkat', icon: LayoutDashboard }],
  },
  {
    label: 'Pesan',
    items: [
      { to: '/messaging', label: 'Kirim Pesan', icon: Send },
      { to: '/scheduled', label: 'Terjadwal', icon: CalendarClock },
      { to: '/chats', label: 'Obrolan', icon: MessagesSquare },
    ],
  },
  {
    label: 'Otomasi & Bot',
    items: [
      { to: '/bot/auto-replies', label: 'Balasan Otomatis', icon: Bot },
      { to: '/bot/menu', label: 'Menu Perintah', icon: Terminal },
      { to: '/bot/ai', label: 'Asisten AI', icon: Sparkles },
      { to: '/bot/groups', label: 'Bot Grup', icon: ShieldCheck },
      { to: '/bot/logs', label: 'Log Bot', icon: ScrollText },
    ],
  },
  {
    label: 'Direktori',
    items: [
      { to: '/groups', label: 'Grup', icon: Users },
      { to: '/account', label: 'Akun', icon: UserRound },
    ],
  },
  {
    label: 'Integrasi',
    items: [
      { to: '/integrations', label: 'Webhook & MCP', icon: Blocks },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/misc', label: 'Saluran & Panggilan', icon: Wrench },
      { to: '/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
]

const routeTitles: Record<string, { label: string; icon: typeof LayoutDashboard }> = {
  '/': { label: 'Perangkat', icon: LayoutDashboard },
  '/messaging': { label: 'Kirim Pesan', icon: Send },
  '/scheduled': { label: 'Terjadwal', icon: CalendarClock },
  '/chats': { label: 'Obrolan', icon: MessagesSquare },
  '/bot/auto-replies': { label: 'Balasan Otomatis', icon: Bot },
  '/bot/rules': { label: 'Balasan Otomatis', icon: Bot },
  '/bot/menu': { label: 'Menu Perintah', icon: Terminal },
  '/bot/ai': { label: 'Asisten AI', icon: Sparkles },
  '/bot/groups': { label: 'Bot Grup', icon: ShieldCheck },
  '/bot/logs': { label: 'Log Bot', icon: ScrollText },
  '/groups': { label: 'Grup', icon: Users },
  '/account': { label: 'Akun', icon: UserRound },
  '/integrations': { label: 'Integrasi Pengembang', icon: Blocks },
  '/webhook': { label: 'Integrasi Pengembang', icon: Blocks },
  '/mcp': { label: 'Integrasi Pengembang', icon: Blocks },
  '/misc': { label: 'Saluran', icon: Wrench },
  '/settings': { label: 'Pengaturan', icon: Settings },
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: devices } = useDevices()
  const totalDevices = devices?.length ?? 0

  return (
    <nav className="flex flex-col gap-3.5">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="text-muted-foreground/70 px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase">
            {group.label}
          </p>
          {group.items
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group/nav relative flex items-center gap-2.5 rounded-[7px] px-3 py-1.5 text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'border-y border-r border-l-2 border-red-500 border-red-500/25 bg-gradient-to-r from-red-500/20 via-rose-500/12 to-transparent font-semibold text-red-500 shadow-2xs shadow-red-500/15 dark:text-red-400'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'size-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-muted-foreground group-hover/nav:text-foreground',
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {to === '/' && totalDevices > 0 && (
                      <span className="bg-muted/80 py-0.2 text-muted-foreground ml-auto rounded-full px-1.5 font-mono text-[10px] font-semibold">
                        {totalDevices}
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-auto size-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-xs shadow-red-500/80" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </div>
      ))}
    </nav>
  )
}

export function AppShell() {
  const status = useConnection((state) => state.status)
  const logout = useConnection((state) => state.logout)
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  const currentRoute = routeTitles[location.pathname] ?? {
    label: 'Dasbor',
    icon: LayoutDashboard,
  }
  const CurrentIcon = currentRoute.icon

  if (status === 'booting') {
    return (
      <div className="ambient-glow bg-background relative flex min-h-svh items-center justify-center">
        <div aria-hidden="true" className="grid-pattern pointer-events-none fixed inset-0 z-0" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-red-500" />
          <p className="text-muted-foreground text-xs font-medium">Menghubungkan ke GOWA…</p>
        </div>
      </div>
    )
  }

  if (status !== 'connected') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="ambient-glow bg-background relative flex h-screen w-full overflow-hidden">
      <div aria-hidden="true" className="grid-pattern pointer-events-none fixed inset-0 z-0" />

      <aside className="border-sidebar-border/70 bg-sidebar/80 sticky top-0 z-20 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r backdrop-blur-xl md:flex select-none">
        <div className="border-sidebar-border/70 relative flex h-14 shrink-0 items-center border-b px-4">
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-red-500/40 via-rose-500/20 to-transparent" />
          <Logo />
        </div>

        <ScrollArea className="flex-1 px-2.5 py-3">
          <NavContent />
        </ScrollArea>

        <div className="border-sidebar-border/70 shrink-0 border-t p-3">
          <div className="flex items-center justify-between gap-1.5">
            <div className="text-muted-foreground flex flex-1 items-center justify-between rounded-lg border border-red-500/20 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent px-2.5 py-1.5 text-[11px] backdrop-blur-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-red-500 shadow-xs shadow-red-500/80" />
                <span>Core v9.6</span>
              </div>
              <span className="font-mono font-medium text-red-500 dark:text-red-400">PureGo</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Kunci / Keluar"
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 size-8 shrink-0 rounded-lg"
            >
              <Lock className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="border-sidebar-border/70 bg-sidebar/95 w-72 border-r p-0 backdrop-blur-xl"
        >
          <SheetHeader className="border-sidebar-border/70 border-b p-4">
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-3 py-3">
            <NavContent onNavigate={() => setMobileNavOpen(false)} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-border/60 bg-background/80 shrink-0 sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-3 backdrop-blur-xl sm:gap-3 sm:px-6 select-none">
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-red-500/40 via-rose-500/20 to-transparent" />
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              className="size-8 shrink-0 md:hidden"
            >
              <Menu className="size-4" />
            </Button>
            <div className="flex min-w-0 items-center gap-2">
              <div className="hidden size-7 shrink-0 items-center justify-center rounded-md border border-red-500/30 bg-gradient-to-br from-red-500/20 via-rose-500/10 to-transparent text-red-500 shadow-2xs md:flex dark:text-red-400">
                <CurrentIcon className="size-3.5" />
              </div>
              <span className="text-foreground truncate text-xs font-semibold sm:text-sm">
                {currentRoute.label}
              </span>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
            <DeviceSwitcher />
            <Button
              asChild
              size="sm"
              className="hidden h-8 shrink-0 gap-1.5 rounded-lg text-xs font-semibold sm:inline-flex"
            >
              <Link to="/messaging">
                <Send className="size-3" />
                <span>Kirim</span>
              </Link>
            </Button>
            <WsBadge />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon-sm"
              title="Kunci / Keluar"
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 size-8 shrink-0 rounded-lg"
            >
              <Lock className="size-4" />
            </Button>
          </div>
        </header>

        <main
          ref={mainRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto pb-20 md:pb-6',
            location.pathname === '/chats'
              ? 'p-2 sm:p-3 overflow-hidden flex flex-col md:pb-0'
              : location.pathname.startsWith('/bot/menu')
                ? 'p-2.5 sm:p-3.5 md:p-4'
                : 'p-3 sm:p-4 md:p-6'
          )}
        >
          <div
            key={location.pathname}
            className={cn(
              'stagger flex flex-col',
              location.pathname === '/chats'
                ? 'w-full h-full flex-1 max-w-none'
                : location.pathname.startsWith('/bot/menu')
                  ? 'w-full max-w-none gap-3 sm:gap-3.5'
                  : 'w-full max-w-[1600px] mx-auto gap-3.5 sm:gap-4'
            )}
          >
            <Outlet />
          </div>
        </main>

        <nav className="border-border/70 bg-background/90 fixed right-0 bottom-0 left-0 z-30 flex h-14 items-center justify-around border-t px-2 backdrop-blur-xl md:hidden">
          <div className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-red-500/40 via-rose-500/20 to-transparent" />
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'font-bold text-red-500 dark:text-red-400' : 'text-muted-foreground',
              )
            }
          >
            <LayoutDashboard className="size-4" />
            <span>Perangkat</span>
          </NavLink>
          <NavLink
            to="/messaging"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'font-bold text-red-500 dark:text-red-400' : 'text-muted-foreground',
              )
            }
          >
            <Send className="size-4" />
            <span>Kirim</span>
          </NavLink>
          <NavLink
            to="/chats"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'font-bold text-red-500 dark:text-red-400' : 'text-muted-foreground',
              )
            }
          >
            <MessagesSquare className="size-4" />
            <span>Obrolan</span>
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'font-bold text-red-500 dark:text-red-400' : 'text-muted-foreground',
              )
            }
          >
            <UserRound className="size-4" />
            <span>Akun</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="text-muted-foreground flex flex-col items-center gap-0.5 text-[10px] font-medium"
          >
            <Menu className="size-4" />
            <span>Menu</span>
          </button>
        </nav>
      </div>

      <PasskeyDialog />
    </div>
  )
}
