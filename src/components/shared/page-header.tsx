import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-foreground flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl">
          <span className="inline-block h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-red-500 via-rose-500 to-red-600 shadow-xs shadow-red-500/60" />
          <span>{title}</span>
        </h1>
        {description && (
          <p className="text-muted-foreground pl-3.5 text-xs sm:text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
