import { useState } from 'react'
import {
  CalendarClock,
  CircleUserRound,
  LayoutDashboard,
  Loader2,
  Menu,
  MessagesSquare,
  Plus,
  Send,
  Settings,
  Smartphone,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { DeviceSwitcher } from '@/components/layout/device-switcher'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { WsBadge } from '@/components/layout/ws-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { PasskeyDialog } from '@/features/session/passkey-dialog'
import { useAppInfo } from '@/hooks/use-app-info'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { useDevices } from '@/hooks/use-devices'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'

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
  '/': { label: 'WhatsApp Devices', icon: LayoutDashboard },
  '/messaging': { label: 'Messaging Studio', icon: Send },
  '/scheduled': { label: 'Scheduled Queue', icon: CalendarClock },
  '/chats': { label: 'Chat History', icon: MessagesSquare },
  '/groups': { label: 'Group Directory', icon: Users },
  '/account': { label: 'Account & Identity', icon: UserRound },
  '/misc': { label: 'Channels & Calls', icon: Wrench },
  '/settings': { label: 'Settings & Diagnostics', icon: Settings },
}

function SidebarActiveSession() {
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const { data: devices } = useDevices()
  const [createOpen, setCreateOpen] = useState(false)

  const activeDevice = devices?.find((d) => d.id === selectedDeviceId)
  const avatar = useDeviceAvatar(activeDevice)

  if (activeDevice) {
    return (
      <Link
        to="/account"
        className="group mx-2.5 my-2 flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.07] p-2 transition-all hover:bg-primary/[0.12] hover:border-primary/40"
      >
        <div className="relative">
          <Avatar className="size-8 border border-primary/30">
            {avatar.data?.url && (
              <AvatarImage src={avatar.data.url} alt={activeDevice.display_name || activeDevice.id} />
            )}
            <AvatarFallback className="bg-primary/10">
              <CircleUserRound className="size-4 text-primary" />
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-[11px] font-semibold text-foreground">
              {activeDevice.display_name || activeDevice.id}
            </span>
            <span className="rounded bg-primary/20 px-1 py-0.2 font-mono text-[9px] font-semibold text-primary">
              Active
            </span>
          </div>
          <span className="block truncate font-mono text-[10px] text-muted-foreground">
            {activeDevice.phone_number || activeDevice.jid || activeDevice.id}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <>
      <div className="mx-2.5 my-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-amber-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              No Active Session
            </span>
            <span className="text-[10px] text-muted-foreground">Select or pair device</span>
          </div>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={() => setCreateOpen(true)}
          className="h-6 gap-1 rounded-[5px] border-amber-500/40 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
        >
          <Plus className="size-2.5" />
          <span>Add</span>
        </Button>
      </div>
      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: info } = useAppInfo()
  const { data: devices } = useDevices()
  const totalDevices = devices?.length ?? 0

  return (
    <nav className="flex flex-col gap-3.5">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
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
                      ? 'border border-primary/25 bg-primary/12 font-semibold text-primary shadow-2xs'
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
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover/nav:text-foreground',
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {to === '/' && totalDevices > 0 && (
                      <span className="ml-auto rounded-full bg-muted/80 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-muted-foreground">
                        {totalDevices}
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-auto size-1.5 rounded-full bg-primary shadow-xs shadow-primary/80" />
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
      <div className="ambient-glow flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Connecting to GOWA session…</p>
        </div>
      </div>
    )
  }

  if (status !== 'connected') {
    return <Navigate to="/connect" replace />
  }

  return (
    <div className="ambient-glow relative flex min-h-svh bg-background/95">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar/80 backdrop-blur-xl md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border/70 px-4">
          <Logo />
        </div>

        <SidebarActiveSession />

        <ScrollArea className="flex-1 px-2.5 py-2">
          <NavContent />
        </ScrollArea>

        <div className="border-t border-sidebar-border/70 p-3">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Core v9.6</span>
            </div>
            <span className="font-mono text-emerald-500 font-medium">PureGo</span>
          </div>
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 border-r border-sidebar-border/70 bg-sidebar/95 p-0 backdrop-blur-xl"
        >
          <SheetHeader className="border-b border-sidebar-border/70 p-4">
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="p-2">
            <SidebarActiveSession />
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            <NavContent onNavigate={() => setMobileNavOpen(false)} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden size-8"
            >
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="hidden size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary md:flex">
                <CurrentIcon className="size-3.5" />
              </div>
              <h1 className="text-xs font-semibold text-foreground sm:text-sm">
                {currentRoute.label}
              </h1>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <DeviceSwitcher />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1.5 rounded-lg border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10 sm:inline-flex"
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

        <main className="flex-1 p-3.5 pb-20 sm:p-5 md:p-6 md:pb-6">
          <div key={location.pathname} className="stagger mx-auto flex max-w-5xl flex-col gap-4 sm:gap-5">
            <Outlet />
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border/70 bg-background/90 px-2 backdrop-blur-xl md:hidden">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'font-bold text-primary' : 'text-muted-foreground',
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
                isActive ? 'font-bold text-primary' : 'text-muted-foreground',
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
                isActive ? 'font-bold text-primary' : 'text-muted-foreground',
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
                isActive ? 'font-bold text-primary' : 'text-muted-foreground',
              )
            }
          >
            <UserRound className="size-4" />
            <span>Account</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground"
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
