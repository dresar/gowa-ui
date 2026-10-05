import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, RefreshCw, ShieldAlert, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  deleteGroupRule,
  listGroupRules,
  upsertGroupRule,
  type BotGroupRule,
  type UpsertGroupRulePayload,
} from '@/api/bot'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function BotGroupsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<BotGroupRule | null>(null)

  const [groupJid, setGroupJid] = useState('')
  const [antiLinkEnabled, setAntiLinkEnabled] = useState(false)
  const [welcomeEnabled, setWelcomeEnabled] = useState(false)
  const [welcomeTemplate, setWelcomeTemplate] = useState('Welcome {name} to {group}!')
  const [farewellEnabled, setFarewellEnabled] = useState(false)
  const [farewellTemplate, setFarewellTemplate] = useState('Goodbye {name}!')

  const { data: groupRules = [], isLoading, refetch } = useQuery({
    queryKey: ['bot-group-rules'],
    queryFn: listGroupRules,
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: UpsertGroupRulePayload = {
        group_jid: groupJid.trim(),
        anti_link_enabled: antiLinkEnabled,
        welcome_enabled: welcomeEnabled,
        welcome_template: welcomeTemplate,
        farewell_enabled: farewellEnabled,
        farewell_template: farewellTemplate,
      }
      return upsertGroupRule(payload)
    },
    onSuccess: () => {
      toast.success('Policy saved')
      setDialogOpen(false)
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Save failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGroupRule,
    onSuccess: () => {
      toast.success('Policy deleted')
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Delete failed')
    },
  })

  const resetForm = () => {
    setEditingGroup(null)
    setGroupJid('')
    setAntiLinkEnabled(false)
    setWelcomeEnabled(false)
    setWelcomeTemplate('Welcome {name} to {group}!')
    setFarewellEnabled(false)
    setFarewellTemplate('Goodbye {name}!')
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (rule: BotGroupRule) => {
    setEditingGroup(rule)
    setGroupJid(rule.group_jid)
    setAntiLinkEnabled(rule.anti_link_enabled)
    setWelcomeEnabled(rule.welcome_enabled)
    setWelcomeTemplate(rule.welcome_template || 'Welcome {name} to {group}!')
    setFarewellEnabled(rule.farewell_enabled)
    setFarewellTemplate(rule.farewell_template || 'Goodbye {name}!')
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Group Bot"
        description="Moderation"
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
              <span>Add Group</span>
            </Button>
          </div>
        }
      />

      {groupRules.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="No Group Policies"
          hint="Add a group policy to configure anti-link moderation, welcome messages, and farewells."
          action={
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Group</span>
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold">Group JID</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold">Anti-Link</TableHead>
                <TableHead className="text-xs font-semibold">Welcome</TableHead>
                <TableHead className="text-xs font-semibold">Farewell</TableHead>
                <TableHead className="w-[90px] text-right text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupRules.map((rule) => (
                <TableRow key={rule.group_jid} className="transition-colors hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-medium text-foreground">
                    {rule.group_jid}
                  </TableCell>
                  <TableCell>
                    {rule.anti_link_enabled ? (
                      <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-[11px] gap-1">
                        <ShieldAlert className="size-3" />
                        <span>Enabled</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {rule.welcome_enabled ? rule.welcome_template || 'Enabled' : 'Disabled'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {rule.farewell_enabled ? rule.farewell_template || 'Enabled' : 'Disabled'}
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
                          if (confirm('Delete policy?')) {
                            deleteMutation.mutate(rule.group_jid)
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
              {editingGroup ? 'Edit Group Policy' : 'Add Group Policy'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Group JID</Label>
              <Input
                value={groupJid}
                onChange={(e) => setGroupJid(e.target.value)}
                disabled={!!editingGroup}
                placeholder="JID"
                className="h-8 text-xs rounded-[6px] font-mono"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/20">
              <div className="flex flex-col gap-0.5">
                <Label className="text-xs font-semibold">Anti-Link</Label>
                <span className="text-[11px] text-muted-foreground">
                  Auto revoke link messages in group
                </span>
              </div>
              <Switch
                checked={antiLinkEnabled}
                onCheckedChange={setAntiLinkEnabled}
                className="data-[state=checked]:bg-red-600"
              />
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Welcome</Label>
                <Switch
                  checked={welcomeEnabled}
                  onCheckedChange={setWelcomeEnabled}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              {welcomeEnabled && (
                <Textarea
                  value={welcomeTemplate}
                  onChange={(e) => setWelcomeTemplate(e.target.value)}
                  placeholder="Template"
                  className="min-h-[70px] text-xs rounded-[6px] bg-background"
                />
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Farewell</Label>
                <Switch
                  checked={farewellEnabled}
                  onCheckedChange={setFarewellEnabled}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              {farewellEnabled && (
                <Textarea
                  value={farewellTemplate}
                  onChange={(e) => setFarewellTemplate(e.target.value)}
                  placeholder="Template"
                  className="min-h-[70px] text-xs rounded-[6px] bg-background"
                />
              )}
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
              disabled={saveMutation.isPending || !groupJid.trim()}
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
