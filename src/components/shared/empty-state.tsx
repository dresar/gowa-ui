import type { ReactNode, ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <Card className="border border-border/70 bg-card/60 backdrop-blur-xl shadow-xs">
      <CardContent className="flex flex-col items-center gap-3.5 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-2xs">
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground">{title}</p>
          {hint && <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
        {action && <div className="mt-1">{action}</div>}
      </CardContent>
    </Card>
  )
}
