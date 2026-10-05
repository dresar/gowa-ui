import { useState } from 'react'
import {
  Bot,
  CalendarClock,
  LayoutDashboard,
  Loader2,
  Menu,
  MessagesSquare,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
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
import { useAppInfo } from '@/hooks/use-app-info'
import { useDevices } from '@/hooks/use-devices'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Devices', icon: LayoutDashboard }],
  },
  {
    label: 'Messaging',
    items: [
      { to: '/messaging', label: 'Messaging', icon: Send },
      { to: '/scheduled', label: 'Scheduled', icon: CalendarClock },
      { to: '/chats', label: 'Chats', icon: MessagesSquare },
    ],
  },
  {
    label: 'Automation & Bot',
    items: [
      { to: '/bot/auto-replies', label: 'Auto Replies', icon: Bot },
      { to: '/bot/ai', label: 'AI Assistant', icon: Sparkles },
      { to: '/bot/groups', label: 'Group Bot', icon: ShieldCheck },
      { to: '/bot/logs', label: 'Bot Logs', icon: ScrollText },
    ],
  },
  {
    label: 'Directory',
    items: [
      { to: '/groups', label: 'Groups', icon: Users },
      { to: '/account', label: 'Account', icon: UserRound },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/misc', label: 'Channels & Calls', icon: Wrench },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const routeTitles: Record<string, { label: string; icon: typeof LayoutDashboard }> = {
  '/': { label: 'Devices', icon: LayoutDashboard },
  '/messaging': { label: 'Messaging', icon: Send },
  '/scheduled': { label: 'Scheduled', icon: CalendarClock },
  '/chats': { label: 'Chats', icon: MessagesSquare },
  '/bot/auto-replies': { label: 'Auto Replies', icon: Bot },
  '/bot/rules': { label: 'Auto Replies', icon: Bot },
  '/bot/ai': { label: 'AI Assistant', icon: Sparkles },
  '/bot/groups': { label: 'Group Bot', icon: ShieldCheck },
  '/bot/logs': { label: 'Bot Logs', icon: ScrollText },
  '/groups': { label: 'Groups', icon: Users },
  '/account': { label: 'Account', icon: UserRound },
  '/misc': { label: 'Channels', icon: Wrench },
  '/settings': { label: 'Settings', icon: Settings },
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: info } = useAppInfo()
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
            .filter(({ to }) => to !== '/scheduled' || info?.scheduled_sends)
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
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const currentRoute = routeTitles[location.pathname] ?? {
    label: 'Dashboard',
    icon: LayoutDashboard,
  }
  const CurrentIcon = currentRoute.icon

  if (status === 'booting') {
    return (
      <div className="ambient-glow bg-background relative flex min-h-svh items-center justify-center">
        <div aria-hidden="true" className="grid-pattern pointer-events-none fixed inset-0 z-0" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-red-500" />
          <p className="text-muted-foreground text-xs font-medium">Connecting to GOWA session…</p>
        </div>
      </div>
    )
  }

  if (status !== 'connected') {
    return <Navigate to="/connect" replace />
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
          <div className="text-muted-foreground flex items-center justify-between rounded-lg border border-red-500/20 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent px-2.5 py-1.5 text-[11px] backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-red-500 shadow-xs shadow-red-500/80" />
              <span>Core v9.6</span>
            </div>
            <span className="font-mono font-medium text-red-500 dark:text-red-400">PureGo</span>
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
                <span>Compose</span>
              </Link>
            </Button>
            <WsBadge />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-3.5 pb-20 sm:p-5 md:p-6 md:pb-6">
          <div
            key={location.pathname}
            className="stagger mx-auto flex max-w-5xl flex-col gap-4 sm:gap-5"
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
            <span>Devices</span>
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
            <span>Compose</span>
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
            <span>Chats</span>
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
            <span>Account</span>
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
