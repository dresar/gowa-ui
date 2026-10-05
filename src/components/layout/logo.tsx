import logoUrl from '@/assets/gowa-logo.webp'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-500/35 bg-gradient-to-br from-red-500/20 via-rose-500/10 to-transparent p-1 shadow-xs shadow-red-500/20 backdrop-blur-xs">
        <img src={logoUrl} alt="GOWA" className="size-5.5 object-contain" />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-foreground text-sm font-bold tracking-tight">
            GOWA
          </span>
          <span className="py-0.2 rounded border border-red-500/30 bg-gradient-to-r from-red-500/20 to-rose-500/10 px-1 font-mono text-[9px] font-semibold text-red-500 dark:text-red-400">
            v9.6
          </span>
        </div>
        <span className="text-muted-foreground text-[10px] leading-none font-medium">
          WhatsApp Gateway
        </span>
      </div>
    </div>
  )
}
