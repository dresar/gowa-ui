import logoUrl from '@/assets/gowa-logo.webp'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1 shadow-2xs backdrop-blur-xs">
        <img src={logoUrl} alt="GOWA" className="size-5.5 object-contain" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-sm font-bold tracking-tight text-foreground">
            GOWA
          </span>
          <span className="rounded border border-primary/30 bg-primary/15 px-1 py-0.2 font-mono text-[9px] font-semibold text-primary">
            v9.6
          </span>
        </div>
        <span className="text-muted-foreground text-[10px] leading-none font-medium">WhatsApp Gateway</span>
      </div>
    </div>
  )
}
