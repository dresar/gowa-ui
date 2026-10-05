import type { ComponentType, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ActionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="glass-card rounded-xl backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/20 to-rose-500/10 text-red-500 shadow-2xs dark:text-red-400">
              <Icon className="size-3.5" />
            </span>
          )}
          <div>
            <CardTitle className="text-foreground text-sm font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground text-xs">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}
