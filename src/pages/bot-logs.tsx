import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ScrollText,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { clearLogs, listLogs, type BotEventLog } from '@/api/bot'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/format'

const PAGE_SIZE = 25

export default function BotLogsPage() {
  const queryClient = useQueryClient()
  const [eventType, setEventType] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [groupJid, setGroupJid] = useState('')
  const [offset, setOffset] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bot-logs', eventType, status, search, groupJid, offset],
    queryFn: () =>
      listLogs({
        event_type: eventType === 'all' ? undefined : eventType,
        status: status === 'all' ? undefined : status,
        search: search.trim() || undefined,
        group_jid: groupJid.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
  })

  const clearMutation = useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      toast.success('Logs cleared')
      setOffset(0)
      void queryClient.invalidateQueries({ queryKey: ['bot-logs'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Clear failed')
    },
  })

  const logs = data?.logs || []
  const total = data?.total || 0

  const getEventBadge = (type: BotEventLog['event_type']) => {
    switch (type) {
      case 'auto_reply':
        return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[10px]">auto_reply</Badge>
      case 'group_moderation':
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px]">moderation</Badge>
      case 'ai_chat':
        return <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[10px]">ai_chat</Badge>
      case 'ai_tool':
        return <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[10px]">ai_tool</Badge>
      default:
        return <Badge variant="destructive" className="text-[10px]">{type}</Badge>
    }
  }

  const getStatusBadge = (st: BotEventLog['status']) => {
    switch (st) {
      case 'success':
        return <span className="inline-flex size-2 rounded-full bg-emerald-500" title="Success" />
      case 'failed':
        return <span className="inline-flex size-2 rounded-full bg-rose-500" title="Failed" />
      case 'ignored':
        return <span className="inline-flex size-2 rounded-full bg-amber-500" title="Ignored" />
      case 'rate_limited':
        return <span className="inline-flex size-2 rounded-full bg-purple-500" title="Rate Limited" />
      default:
        return <span className="inline-flex size-2 rounded-full bg-muted-foreground" />
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Bot Logs"
        description="History"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Clear all logs?')) {
                  clearMutation.mutate()
                }
              }}
              disabled={clearMutation.isPending || total === 0}
              className="h-8 gap-1.5 rounded-[6px] text-xs shadow-xs"
            >
              <Trash2 className="size-3.5" />
              <span>Clear</span>
            </Button>
          </div>
        }
      />

      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOffset(0)
              }}
              placeholder="Search"
              className="h-8 pl-8 text-xs rounded-[6px]"
            />
          </div>
          <Input
            value={groupJid}
            onChange={(e) => {
              setGroupJid(e.target.value)
              setOffset(0)
            }}
            placeholder="JID"
            className="h-8 w-[140px] text-xs rounded-[6px] font-mono"
          />
          <Select
            value={eventType}
            onValueChange={(val) => {
              setEventType(val)
              setOffset(0)
            }}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-[6px]">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="auto_reply">Auto Reply</SelectItem>
              <SelectItem value="group_moderation">Moderation</SelectItem>
              <SelectItem value="ai_chat">AI Chat</SelectItem>
              <SelectItem value="ai_tool">AI Tool</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val)
              setOffset(0)
            }}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-[6px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
              <SelectItem value="rate_limited">Limited</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {logs.length === 0 && !isLoading ? (
        <EmptyState
          icon={ScrollText}
          title="No Logs Found"
          hint="No bot events matching the current filter criteria."
        />
      ) : (
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[40px] text-center"></TableHead>
                <TableHead className="w-[110px] text-xs font-semibold">Event</TableHead>
                <TableHead className="w-[150px] text-xs font-semibold">Sender / Group</TableHead>
                <TableHead className="text-xs font-semibold">Incoming</TableHead>
                <TableHead className="text-xs font-semibold">Response</TableHead>
                <TableHead className="w-[80px] text-right text-xs font-semibold">Latency</TableHead>
                <TableHead className="w-[140px] text-right text-xs font-semibold">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="transition-colors hover:bg-muted/20">
                  <TableCell className="text-center">
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell>{getEventBadge(log.event_type)}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[150px]">
                    {log.group_jid || log.sender_jid}
                  </TableCell>
                  <TableCell className="text-xs text-foreground max-w-[200px] truncate">
                    {log.incoming_message || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                    {log.response_message || '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {log.latency_ms}ms
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
            <span>
              {total === 0
                ? '0 records'
                : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="h-7 text-xs rounded-[5px] gap-1 px-2.5"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="h-7 text-xs rounded-[5px] gap-1 px-2.5"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
