import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Send, Users } from 'lucide-react'
import { listContacts } from '@/api/user'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { toApiError } from '@/lib/api-error'
import { useRecipientStore } from '@/stores/recipient'

export function ContactsView() {
  const navigate = useNavigate()
  const device = useSelectedDevice()
  const [search, setSearch] = useState('')
  const setRecipient = useRecipientStore((state) => state.setRecipient)

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', device],
    queryFn: listContacts,
    enabled: !!device,
  })

  const contacts = data?.data ?? []

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const query = search.toLowerCase().trim()
    return contacts.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        c.jid.toLowerCase().includes(query),
    )
  }, [contacts, search])

  const onMessage = (jid: string) => {
    const phone = jid.split('@')[0]
    setRecipient({ phone, type: 'user' })
    navigate('/messaging')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        {toApiError(error).message}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 p-8 text-center backdrop-blur-xl">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-muted-foreground">
          <Users className="size-5" />
        </div>
        <p className="text-xs font-semibold text-foreground">No Synced Contacts</p>
        <p className="max-w-xs text-[11px] text-muted-foreground">
          This WhatsApp session does not have local contacts stored yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or number…"
            className="h-8.5 pl-8 text-xs rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border/60 bg-muted/50 px-2 py-1 text-[11px] font-mono text-muted-foreground">
            {filtered.length} of {contacts.length} contacts
          </span>
        </div>
      </div>

      <div className="max-h-96 divide-y divide-border/50 overflow-y-auto rounded-xl border border-border/70 bg-card/60 backdrop-blur-xl">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No contacts match "{search}"
          </div>
        ) : (
          filtered.map((contact) => {
            const phone = contact.jid.split('@')[0]
            const initials = (contact.name || phone).slice(0, 2).toUpperCase()
            return (
              <div
                key={contact.jid}
                className="flex items-center justify-between gap-3 p-2.5 px-3.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8 border border-border/80">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {contact.name || 'Unnamed Contact'}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {phone}
                    </p>
                  </div>
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onMessage(contact.jid)}
                  className="h-7 gap-1 rounded-[6px] border-primary/30 text-[11px] font-semibold text-primary hover:bg-primary/10 active:scale-[0.98]"
                >
                  <Send className="size-3" />
                  <span>Message</span>
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
