import { useRef, useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { ChatList } from '@/features/chat/chat-list'
import { MessageView } from '@/features/chat/message-view'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { selectedChatForDevice, type ChatSelection } from '@/features/chat/device-scope'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import type { ChatInfo } from '@/api/chat'

export default function ChatsPage() {
  const device = useSelectedDevice()
  const [selection, setSelection] = useState<ChatSelection | null>(null)
  const messagePane = useRef<HTMLDivElement>(null)
  const selected = selectedChatForDevice(selection, device)

  const handleSelect = (chat: ChatInfo) => {
    if (!device) return
    setSelection({ deviceId: device, chat })
    messagePane.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  if (!device) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Chats"
          description="Stored conversations."
        />
        <DeviceGuard />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:h-[calc(100svh-8rem)]">
      <PageHeader
        title="Chats"
        description="Stored conversations."
      />
      <div className="grid gap-3 sm:gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[330px_1fr]">
        <Card className="glass-card h-[24rem] overflow-hidden rounded-xl p-3 backdrop-blur-xl lg:h-auto lg:min-h-0">
          <ChatList
            key={device}
            deviceId={device}
            selectedJid={selected?.jid ?? null}
            onSelect={handleSelect}
          />
        </Card>
        <Card
          ref={messagePane}
          className="glass-card h-[calc(100svh-9rem)] min-h-[26rem] overflow-hidden rounded-xl p-3 backdrop-blur-xl lg:h-auto lg:min-h-0"
        >
          {selected ? (
            <MessageView key={`${device}:${selected.jid}`} chat={selected} deviceId={device} />
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2.5">
              <div className="border-border/80 bg-muted/40 text-primary flex size-12 items-center justify-center rounded-xl border shadow-2xs">
                <MessagesSquare className="size-6" />
              </div>
              <p className="text-foreground text-xs font-medium">Select a conversation</p>
              <p className="text-muted-foreground text-[11px]">
                Click any chat from the left panel to stream stored messages
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
