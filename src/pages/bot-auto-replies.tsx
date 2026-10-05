import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Edit, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createRule,
  deleteRule,
  listRules,
  toggleRule,
  updateRule,
  type BotRule,
  type CreateRulePayload,
} from '@/api/bot'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export default function BotAutoRepliesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'private' | 'group'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BotRule | null>(null)

  const [triggerType, setTriggerType] = useState<'exact' | 'contains' | 'starts_with' | 'regex'>('exact')
  const [triggerValue, setTriggerValue] = useState('')
  const [scope, setScope] = useState<'all' | 'private' | 'group'>('all')
  const [responseType, setResponseType] = useState<'text' | 'media'>('text')
  const [responseContent, setResponseContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['bot-rules', search, scopeFilter, activeFilter],
    queryFn: () =>
      listRules({
        search: search.trim() || undefined,
        scope: scopeFilter === 'all' ? undefined : scopeFilter,
        active: activeFilter === 'all' ? undefined : activeFilter,
      }),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateRulePayload = {
        trigger_type: triggerType,
        trigger_value: triggerValue.trim(),
        scope,
        response_type: responseType,
        response_content: responseContent.trim(),
        media_url: mediaUrl.trim() || undefined,
        is_active: isActive,
      }
      if (editingRule) {
        return updateRule(editingRule.id, payload)
      }
      return createRule(payload)
    },
    onSuccess: () => {
      toast.success(editingRule ? 'Rule updated' : 'Rule created')
      setDialogOpen(false)
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Toggle failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      toast.success('Rule deleted')
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Delete failed')
    },
  })

  const resetForm = () => {
    setEditingRule(null)
    setTriggerType('exact')
    setTriggerValue('')
    setScope('all')
    setResponseType('text')
    setResponseContent('')
    setMediaUrl('')
    setIsActive(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (rule: BotRule) => {
    setEditingRule(rule)
    setTriggerType(rule.trigger_type)
    setTriggerValue(rule.trigger_value)
    setScope(rule.scope)
    setResponseType(rule.response_type)
    setResponseContent(rule.response_content)
    setMediaUrl(rule.media_url || '')
    setIsActive(rule.is_active)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Auto Replies"
        description="Keyword triggers"
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
              size="sm"
              onClick={openCreateDialog}
              className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs shadow-red-500/30"
            >
              <Plus className="size-3.5" />
              <span>New Rule</span>
            </Button>
          </div>
        }
      />

      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-8 pl-8 text-xs rounded-[6px]"
            />
          </div>
          <Select
            value={scopeFilter}
            onValueChange={(val) => setScopeFilter(val as 'all' | 'private' | 'group')}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-[6px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(val) => setActiveFilter(val as 'all' | 'true' | 'false')}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-[6px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {rules.length === 0 && !isLoading ? (
        <EmptyState
          icon={Bot}
          title="No Rules"
          hint="Create an auto-reply rule to respond to triggers automatically."
          action={
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>New Rule</span>
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[120px] text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Trigger</TableHead>
                <TableHead className="w-[100px] text-xs font-semibold">Scope</TableHead>
                <TableHead className="text-xs font-semibold">Response</TableHead>
                <TableHead className="w-[80px] text-center text-xs font-semibold">Active</TableHead>
                <TableHead className="w-[100px] text-right text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} className="transition-colors hover:bg-muted/20">
                  <TableCell>
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[11px] font-mono">
                      {rule.trigger_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-foreground">
                    {rule.trigger_value}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[11px] capitalize">
                      {rule.scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {rule.response_content}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => toggleMutation.mutate(rule.id)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-[5px]"
                        onClick={() => openEditDialog(rule)}
                      >
                        <Edit className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-[5px] text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Delete rule?')) {
                            deleteMutation.mutate(rule.id)
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight">
              {editingRule ? 'Edit Rule' : 'Create Rule'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Type</Label>
                <Select
                  value={triggerType}
                  onValueChange={(val) =>
                    setTriggerType(val as 'exact' | 'contains' | 'starts_with' | 'regex')
                  }
                >
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="starts_with">Prefix</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(val) => setScope(val as 'all' | 'private' | 'group')}
                >
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Trigger</Label>
              <Input
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder="Keyword"
                className="h-8 text-xs rounded-[6px] font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Response</Label>
              <Select
                value={responseType}
                onValueChange={(val) => setResponseType(val as 'text' | 'media')}
              >
                <SelectTrigger className="h-8 text-xs rounded-[6px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {responseType === 'media' && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Media</Label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="URL"
                  className="h-8 text-xs rounded-[6px] font-mono"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Message</Label>
              <Textarea
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Response"
                className="min-h-[80px] text-xs rounded-[6px]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs font-medium">Active</Label>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !triggerValue.trim() || !responseContent.trim()}
              className="h-8 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
