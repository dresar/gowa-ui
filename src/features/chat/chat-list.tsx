import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { listChats, type ChatInfo } from '@/api/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { chatListQueryKey } from '@/features/chat/device-scope'
import { chatDisplayName } from '@/features/chat/display-name'
import { formatDate, isZeroTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

export function ChatList({
  deviceId,
  selectedJid,
  onSelect,
}: {
  deviceId: string
  selectedJid: string | null
  onSelect: (chat: ChatInfo) => void
}) {
  const [search, setSearch] = useState('')
  const [hasMedia, setHasMedia] = useState(false)
  const [offset, setOffset] = useState(0)

  const query = useQuery({
    queryKey: chatListQueryKey(deviceId, { search, hasMedia, offset }),
    queryFn: () =>
      listChats(
        {
          search: search || undefined,
          has_media: hasMedia || undefined,
          limit: PAGE_SIZE,
          offset,
        },
        deviceId,
      ),
    placeholderData: keepPreviousData,
  })

  const chats = query.data?.data ?? []
  const total = query.data?.pagination.total ?? 0

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
          <Input
            className="h-8 pl-8 text-xs font-medium"
            placeholder="Search conversations…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setOffset(0)
            }}
          />
        </div>
        <label className="text-muted-foreground flex items-center gap-2 text-xs select-none">
          <Switch
            checked={hasMedia}
            onCheckedChange={(value) => {
              setHasMedia(value)
              setOffset(0)
            }}
          />
          <span>Media attachments only</span>
        </label>
      </div>

      <ScrollArea className="border-border/60 bg-card/40 min-h-0 flex-1 rounded-lg border backdrop-blur-md">
        {query.isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="text-primary size-5 animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-xs">No conversations found</p>
        ) : (
          <ul className="divide-border/40 divide-y">
            {chats.map((chat) => (
              <li key={chat.jid}>
                <button
                  type="button"
                  onClick={() => onSelect(chat)}
                  className={cn(
                    'group/item flex w-full items-center gap-2.5 px-3 py-2 text-left transition-all duration-150',
                    selectedJid === chat.jid
                      ? 'text-foreground border-l-2 border-red-500 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-transparent font-medium'
                      : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="border-border/70 bg-card/80 font-heading text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold shadow-2xs">
                    {chatDisplayName(chat).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-foreground truncate text-xs font-semibold">
                      {chatDisplayName(chat)}
                    </span>
                    <span className="text-muted-foreground truncate font-mono text-[10px]">
                      {isZeroTime(chat.last_message_time)
                        ? chat.jid
                        : formatDate(chat.last_message_time)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="text-muted-foreground flex items-center justify-between text-[11px]">
        <span>{total} chats listed</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="h-6.5 text-[11px]"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="h-6.5 text-[11px]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
