import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  Check,
  Copy,
  Download,
  Edit,
  Eye,
  FileJson,
  Heart,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  autoTagPacarRules,
  createRule,
  deleteRule,
  importRules,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  DEFAULT_200_AUTO_REPLIES,
  MEGA_PROMPT_200_AUTO_REPLIES,
} from '@/features/bot/default-auto-replies'

const INDAH_PHONE_DISPLAY = '+62 852-1614-9732'
const INDAH_JID = '6285216149732@s.whatsapp.net'

const isPacarRule = (rule: BotRule): boolean => {
  if (!rule.recipient_jid) return false
  return rule.recipient_jid.includes('6285216149732')
}

const isGlobalRule = (rule: BotRule): boolean => {
  return !rule.recipient_jid || rule.recipient_jid === 'all' || rule.recipient_jid === 'global'
}

export default function BotAutoRepliesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState<'all' | 'pacar' | 'global' | 'custom'>('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'private' | 'group'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BotRule | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDetailRule, setSelectedDetailRule] = useState<BotRule | null>(null)
  const [hasCopiedDetail, setHasCopiedDetail] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file')
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string
    size: number
    count: number
  } | null>(null)
  const [fileRules, setFileRules] = useState<CreateRulePayload[]>([])
  const [importJsonText, setImportJsonText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [recipientTargetType, setRecipientTargetType] = useState<'global' | 'pacar' | 'custom'>('global')
  const [customRecipientPhone, setCustomRecipientPhone] = useState('')
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

  const pacarCount = rules.filter(isPacarRule).length
  const globalCount = rules.filter(isGlobalRule).length
  const customCount = rules.filter((r) => !isGlobalRule(r) && !isPacarRule(r)).length

  const filteredRules = rules.filter((rule) => {
    if (targetFilter === 'pacar') return isPacarRule(rule)
    if (targetFilter === 'global') return isGlobalRule(rule)
    if (targetFilter === 'custom') return !isGlobalRule(rule) && !isPacarRule(rule)
    return true
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalRecipient: string | undefined = undefined
      if (recipientTargetType === 'pacar') {
        finalRecipient = INDAH_JID
      } else if (recipientTargetType === 'custom') {
        finalRecipient = customRecipientPhone.trim() || undefined
      } else {
        finalRecipient = ''
      }

      const payload: CreateRulePayload = {
        trigger_type: triggerType,
        trigger_value: triggerValue.trim(),
        recipient_jid: finalRecipient,
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
      toast.success(editingRule ? 'Aturan diperbarui' : 'Aturan dibuat')
      setDialogOpen(false)
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Operasi gagal')
    },
  })

  const importMutation = useMutation({
    mutationFn: async (payload: CreateRulePayload[]) => {
      return importRules(payload)
    },
    onSuccess: (res) => {
      toast.success(`${res.imported} aturan berhasil di-import!`)
      setImportOpen(false)
      setUploadedFileInfo(null)
      setFileRules([])
      setImportJsonText('')
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengimpor aturan')
    },
  })

  const autoTagMutation = useMutation({
    mutationFn: autoTagPacarRules,
    onSuccess: (res) => {
      toast.success(`${res.updated} aturan romantis berhasil ditandai khusus Indah 🧕!`)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menandai aturan pacar')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengubah status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      toast.success('Aturan dihapus')
      if (selectedDetailRule && editingRule?.id === selectedDetailRule.id) {
        setDetailOpen(false)
      }
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus')
    },
  })

  const resetForm = () => {
    setEditingRule(null)
    setRecipientTargetType('global')
    setCustomRecipientPhone('')
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
    if (isPacarRule(rule)) {
      setRecipientTargetType('pacar')
      setCustomRecipientPhone('')
    } else if (rule.recipient_jid && rule.recipient_jid !== 'global' && rule.recipient_jid !== 'all') {
      setRecipientTargetType('custom')
      setCustomRecipientPhone(rule.recipient_jid)
    } else {
      setRecipientTargetType('global')
      setCustomRecipientPhone('')
    }
    setTriggerType(rule.trigger_type)
    setTriggerValue(rule.trigger_value)
    setScope(rule.scope)
    setResponseType(rule.response_type)
    setResponseContent(rule.response_content)
    setMediaUrl(rule.media_url || '')
    setIsActive(rule.is_active)
    setDialogOpen(true)
  }

  const openDetailDialog = (rule: BotRule) => {
    setSelectedDetailRule(rule)
    setHasCopiedDetail(false)
    setDetailOpen(true)
  }

  const handleExport = () => {
    if (!rules.length) {
      toast.error('Belum ada aturan untuk diexport')
      return
    }
    const exportData = rules.map((r) => ({
      trigger_type: r.trigger_type,
      trigger_value: r.trigger_value,
      recipient_jid: r.recipient_jid || undefined,
      scope: r.scope,
      response_type: r.response_type,
      response_content: r.response_content,
      media_url: r.media_url || undefined,
      is_active: r.is_active,
    }))
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `balasan-otomatis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${rules.length} aturan diexport!`)
  }

  const handleDownloadTemplate = () => {
    const jsonStr = JSON.stringify(DEFAULT_200_AUTO_REPLIES, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-200-pemicu-non-formal.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Template 200 pemicu diunduh!')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      try {
        const parsed = JSON.parse(content)
        const list = Array.isArray(parsed) ? parsed : [parsed]
        const valid = list.filter(
          (item): item is CreateRulePayload =>
            Boolean(item) &&
            typeof item === 'object' &&
            Boolean(item.trigger_value) &&
            Boolean(item.response_content),
        )
        if (valid.length === 0) {
          toast.error('Tidak ada data aturan valid di file JSON ini')
          return
        }
        setFileRules(valid)
        setUploadedFileInfo({
          name: file.name,
          size: file.size,
          count: valid.length,
        })
        setImportMode('file')
        toast.success(`File "${file.name}" (${valid.length} aturan) siap di-import!`)
      } catch {
        toast.error('File yang diunggah bukan format JSON valid')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const parsePastedData = (): CreateRulePayload[] => {
    try {
      const parsed = JSON.parse(importJsonText)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      return list.filter(
        (item): item is CreateRulePayload =>
          Boolean(item) &&
          typeof item === 'object' &&
          Boolean(item.trigger_value) &&
          Boolean(item.response_content),
      )
    } catch {
      return []
    }
  }

  const activeImportRules =
    importMode === 'file' && uploadedFileInfo ? fileRules : parsePastedData()

  const handleExecuteImport = () => {
    if (activeImportRules.length === 0) {
      toast.error('Belum ada data aturan yang valid untuk di-import')
      return
    }
    importMutation.mutate(activeImportRules)
  }

  const handleLoadDefault200Preset = () => {
    if (confirm('Muat 200 pemicu non-formal default ke database bot?')) {
      importMutation.mutate(DEFAULT_200_AUTO_REPLIES)
    }
  }

  const copyPromptText = () => {
    void navigator.clipboard.writeText(MEGA_PROMPT_200_AUTO_REPLIES)
    toast.success('Prompt AI disalin!')
  }

  const copyDetailContent = (text: string) => {
    void navigator.clipboard.writeText(text)
    setHasCopiedDetail(true)
    toast.success('Respons disalin ke clipboard!')
    setTimeout(() => setHasCopiedDetail(false), 2000)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <PageHeader
        title="Balasan Otomatis"
        description="Filter pemicu kata kunci & nomor WhatsApp"
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Perbarui</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => autoTagMutation.mutate()}
              disabled={autoTagMutation.isPending || rules.length === 0}
              title="Otomatis menandai pemicu romantis/pasangan khusus untuk nomor Indah"
              className="h-8 gap-1.5 rounded-[6px] text-xs text-pink-600 dark:text-pink-400 border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10"
            >
              <Heart className="size-3.5 fill-pink-500/30" />
              <span>{autoTagMutation.isPending ? 'Menandai...' : 'Tandai Pacar 🧕'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={rules.length === 0}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <Download className="size-3.5" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadedFileInfo(null)
                setFileRules([])
                setImportJsonText('')
                setImportMode('file')
                setImportOpen(true)
              }}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <Upload className="size-3.5" />
              <span>Import</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromptOpen(true)}
              className="h-8 gap-1.5 rounded-[6px] text-xs text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
            >
              <Sparkles className="size-3.5" />
              <span>Prompt AI</span>
            </Button>
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs shadow-red-500/30"
            >
              <Plus className="size-3.5" />
              <span>Baru</span>
            </Button>
          </div>
        }
      />

      {/* Target Filter Tabs & Quick Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setTargetFilter('all')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'all'
              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">Semua Aturan</span>
            <span className="text-base font-bold text-foreground">{rules.length}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">Total</Badge>
        </button>

        <button
          type="button"
          onClick={() => setTargetFilter('pacar')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'pacar'
              ? 'border-pink-500/60 bg-pink-500/10 ring-1 ring-pink-500/30 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1">
              <Heart className="size-3 fill-pink-500/40 text-pink-500" />
              <span>Khusus Pacar</span>
            </span>
            <span className="text-base font-bold text-foreground">{pacarCount}</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-pink-600 dark:text-pink-400 border-pink-500/30 bg-pink-500/5">
            Indah 🧕
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setTargetFilter('global')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'global'
              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">Global (Umum)</span>
            <span className="text-base font-bold text-foreground">{globalCount}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">🌐 Semua</Badge>
        </button>

        <button
          type="button"
          onClick={() => setTargetFilter('custom')}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'custom'
              ? 'border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">Nomor Khusus</span>
            <span className="text-base font-bold text-foreground">{customCount}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">📱 Kontak</Badge>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pemicu atau respons"
              className="h-8 pl-8 text-xs rounded-[6px]"
            />
          </div>
          <Select
            value={targetFilter}
            onValueChange={(val) => setTargetFilter(val as 'all' | 'pacar' | 'global' | 'custom')}
          >
            <SelectTrigger className="h-8 w-[145px] text-xs rounded-[6px]">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Target</SelectItem>
              <SelectItem value="pacar">Khusus Pacar 🧕</SelectItem>
              <SelectItem value="global">Global 🌐</SelectItem>
              <SelectItem value="custom">Nomor Khusus 📱</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={scopeFilter}
            onValueChange={(val) => setScopeFilter(val as 'all' | 'private' | 'group')}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-[6px]">
              <SelectValue placeholder="Cakupan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="private">Pribadi</SelectItem>
              <SelectItem value="group">Grup</SelectItem>
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
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filteredRules.length === 0 && !isLoading ? (
        <EmptyState
          icon={Bot}
          title="Tidak Ada Aturan"
          hint={
            targetFilter === 'pacar'
              ? 'Belum ada aturan khusus Pacar. Klik "Tandai Pacar 🧕" di atas untuk menandai otomatis atau buat aturan baru.'
              : 'Tidak ada aturan balasan otomatis yang sesuai filter.'
          }
          action={
            <div className="flex items-center gap-2">
              {targetFilter === 'pacar' && rules.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => autoTagMutation.mutate()}
                  disabled={autoTagMutation.isPending}
                  className="h-8 gap-1.5 rounded-[6px] bg-pink-600 text-xs text-white hover:bg-pink-700 shadow-xs"
                >
                  <Heart className="size-3.5 fill-white/40" />
                  <span>Tandai Pacar 🧕</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPromptOpen(true)}
                className="h-8 gap-1.5 rounded-[6px] text-xs"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Prompt AI</span>
              </Button>
              <Button
                size="sm"
                onClick={openCreateDialog}
                className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
              >
                <Plus className="size-3.5" />
                <span>Baru</span>
              </Button>
            </div>
          }
        />
      ) : (
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[150px] text-xs font-semibold">Penerima</TableHead>
                <TableHead className="w-[100px] text-xs font-semibold">Tipe</TableHead>
                <TableHead className="text-xs font-semibold">Pemicu</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold">Cakupan</TableHead>
                <TableHead className="text-xs font-semibold">Respons</TableHead>
                <TableHead className="w-[70px] text-center text-xs font-semibold">Aktif</TableHead>
                <TableHead className="w-[120px] text-right text-xs font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => {
                const pacar = isPacarRule(rule)
                const global = isGlobalRule(rule)
                return (
                  <TableRow key={rule.id} className="transition-colors hover:bg-muted/20">
                    {/* Target / Penerima */}
                    <TableCell>
                      {pacar ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge
                            variant="outline"
                            className="w-fit border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-400 gap-1 text-[11px] font-medium"
                          >
                            <Heart className="size-3 fill-pink-500/40" />
                            <span>Pacar 🧕</span>
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {INDAH_PHONE_DISPLAY}
                          </span>
                        </div>
                      ) : global ? (
                        <Badge variant="secondary" className="text-[11px] font-normal text-muted-foreground">
                          🌐 Global
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <Badge
                            variant="outline"
                            className="w-fit border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-mono"
                          >
                            📱 Kontak
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {rule.recipient_jid}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Tipe Pencocokan */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-red-500/30 bg-red-500/10 text-red-500 text-[11px] font-mono"
                      >
                        {rule.trigger_type}
                      </Badge>
                    </TableCell>

                    {/* Kata Pemicu */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      "{rule.trigger_value}"
                    </TableCell>

                    {/* Cakupan */}
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {rule.scope}
                      </Badge>
                    </TableCell>

                    {/* Respons */}
                    <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                      {rule.response_content}
                    </TableCell>

                    {/* Aktif Switch */}
                    <TableCell className="text-center">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleMutation.mutate(rule.id)}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </TableCell>

                    {/* Tombol Aksi */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-[5px] text-primary hover:bg-primary/10"
                          onClick={() => openDetailDialog(rule)}
                          title="Detail Aturan"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-[5px]"
                          onClick={() => openEditDialog(rule)}
                          title="Edit"
                        >
                          <Edit className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-[5px] text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm('Hapus aturan ini?')) {
                              deleteMutation.mutate(rule.id)
                            }
                          }}
                          title="Hapus"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal Detail Aturan - Luas di Desktop */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  <span>Detail Aturan Balasan</span>
                  {selectedDetailRule && (
                    <Badge
                      variant={selectedDetailRule.is_active ? 'default' : 'secondary'}
                      className={
                        selectedDetailRule.is_active
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-[11px]'
                          : 'text-[11px]'
                      }
                    >
                      {selectedDetailRule.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Spesifikasi pemicu, target penerima, dan pesan balasan WhatsApp.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedDetailRule && (
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Header Box Target */}
              <div className="rounded-lg border bg-muted/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      isPacarRule(selectedDetailRule)
                        ? 'bg-pink-500/10 text-pink-500'
                        : isGlobalRule(selectedDetailRule)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-sky-500/10 text-sky-500'
                    }`}
                  >
                    {isPacarRule(selectedDetailRule) ? (
                      <Heart className="size-5 fill-pink-500/30" />
                    ) : isGlobalRule(selectedDetailRule) ? (
                      <Bot className="size-5" />
                    ) : (
                      <User className="size-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Target Penerima</p>
                    <p className="text-sm font-bold text-foreground">
                      {isPacarRule(selectedDetailRule)
                        ? 'Khusus Pacar (Indah 🧕)'
                        : isGlobalRule(selectedDetailRule)
                        ? 'Global (Semua Kontak & Grup)'
                        : `Nomor Khusus: ${selectedDetailRule.recipient_jid}`}
                    </p>
                    {isPacarRule(selectedDetailRule) && (
                      <p className="text-[11px] text-pink-600 dark:text-pink-400 font-mono mt-0.5">
                        WhatsApp: {INDAH_PHONE_DISPLAY} (Hanya merespon pesan dari Indah)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono border-red-500/30 bg-red-500/10 text-red-500">
                    Tipe: {selectedDetailRule.trigger_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    Cakupan: {selectedDetailRule.scope}
                  </Badge>
                </div>
              </div>

              {/* Kata Pemicu */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Kata Pemicu (Trigger)</Label>
                <div className="p-3 rounded-lg border bg-background font-mono text-xs font-bold text-foreground">
                  {selectedDetailRule.trigger_value}
                </div>
              </div>

              {/* Isi Respons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Isi Pesan Balasan ({selectedDetailRule.response_type})
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2 text-primary hover:bg-primary/10"
                    onClick={() => copyDetailContent(selectedDetailRule.response_content)}
                  >
                    {hasCopiedDetail ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>{hasCopiedDetail ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
                <div className="p-3.5 rounded-lg border bg-muted/20 font-sans text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
                  {selectedDetailRule.response_content}
                </div>
              </div>

              {/* Media URL if any */}
              {selectedDetailRule.media_url && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">URL Media Lampiran</Label>
                  <div className="p-2.5 rounded-lg border bg-background font-mono text-xs text-primary truncate">
                    {selectedDetailRule.media_url}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Tutup
            </Button>
            {selectedDetailRule && (
              <Button
                size="sm"
                onClick={() => {
                  setDetailOpen(false)
                  openEditDialog(selectedDetailRule)
                }}
                className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
              >
                <Edit className="size-3.5" />
                <span>Edit Aturan</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog - Luas di Desktop */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
            <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
              {editingRule ? 'Edit Aturan Balasan' : 'Buat Aturan Balasan Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Atur target penerima, pemicu kata kunci, dan isi balasan otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            {/* Target Penerima Section */}
            <div className="space-y-2 p-3.5 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold text-foreground">Target Penerima (Filter Nomor)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientTargetType('global')}
                  className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                    recipientTargetType === 'global'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border/70 bg-background hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <span>🌐 Global</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Semua kontak & grup
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientTargetType('pacar')}
                  className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                    recipientTargetType === 'pacar'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-1 ring-pink-500/40'
                      : 'border-border/70 bg-background hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <Heart className="size-3 fill-pink-500/40 text-pink-500" />
                    <span>Khusus Pacar 🧕</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Indah ({INDAH_PHONE_DISPLAY})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientTargetType('custom')}
                  className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                    recipientTargetType === 'custom'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/40'
                      : 'border-border/70 bg-background hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <span>📱 Nomor Khusus</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Kustom nomor WA
                  </span>
                </button>
              </div>

              {recipientTargetType === 'custom' && (
                <div className="pt-2">
                  <Label className="text-xs font-medium">Nomor WhatsApp Target</Label>
                  <Input
                    value={customRecipientPhone}
                    onChange={(e) => setCustomRecipientPhone(e.target.value)}
                    placeholder="Contoh: 6281234567890"
                    className="h-8 text-xs rounded-[6px] font-mono mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Gunakan kode negara tanpa tanda plus atau karakter lain (misal: 628...).
                  </p>
                </div>
              )}
            </div>

            {/* Grid Tipe & Cakupan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Tipe Pencocokan</Label>
                <Select
                  value={triggerType}
                  onValueChange={(val) =>
                    setTriggerType(val as 'exact' | 'contains' | 'starts_with' | 'regex')
                  }
                >
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Tepat (Exact Match)</SelectItem>
                    <SelectItem value="contains">Mengandung (Contains)</SelectItem>
                    <SelectItem value="starts_with">Awalan (Starts With)</SelectItem>
                    <SelectItem value="regex">Regex (Regular Expression)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Cakupan Ruang Obrolan</Label>
                <Select
                  value={scope}
                  onValueChange={(val) => setScope(val as 'all' | 'private' | 'group')}
                >
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Cakupan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua (Pribadi & Grup)</SelectItem>
                    <SelectItem value="private">Hanya Obrolan Pribadi</SelectItem>
                    <SelectItem value="group">Hanya Obrolan Grup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kata Pemicu */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Kata Kunci Pemicu</Label>
              <Input
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder="Contoh: sayang, halo, berapa harga, info loker"
                className="h-8 text-xs rounded-[6px] font-mono"
              />
            </div>

            {/* Format & Media URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Format Pesan</Label>
                <Select
                  value={responseType}
                  onValueChange={(val) => setResponseType(val as 'text' | 'media')}
                >
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Teks Biasa</SelectItem>
                    <SelectItem value="media">Media (Gambar / Berkas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {responseType === 'media' && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">URL Media</Label>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-8 text-xs rounded-[6px] font-mono"
                  />
                </div>
              )}
            </div>

            {/* Isi Respons */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Isi Pesan Balasan Otomatis</Label>
              <Textarea
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Tuliskan respon otomatis yang ramah dan alami..."
                className="min-h-[110px] text-xs rounded-[6px] leading-relaxed"
              />
            </div>

            {/* Aktif Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex flex-col">
                <Label className="text-xs font-semibold text-foreground">Status Aktif</Label>
                <span className="text-[11px] text-muted-foreground">
                  Aturan ini akan langsung merespon pesan WhatsApp masuk jika aktif.
                </span>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !triggerValue.trim() || !responseContent.trim()}
              className="h-8 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog - Luas di Desktop */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                  Import Aturan Balasan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Unggah berkas JSON hasil AI atau tempel data array aturan.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border text-xs">
                <Button
                  type="button"
                  variant={importMode === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[11px] px-2.5 rounded-md"
                  onClick={() => setImportMode('file')}
                >
                  Berkas
                </Button>
                <Button
                  type="button"
                  variant={importMode === 'paste' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[11px] px-2.5 rounded-md"
                  onClick={() => setImportMode('paste')}
                >
                  Teks
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto max-h-[60vh] text-xs">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />

            {importMode === 'file' ? (
              uploadedFileInfo ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <FileJson className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate max-w-[280px]">
                          {uploadedFileInfo.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {(uploadedFileInfo.size / 1024).toFixed(1)} KB • {uploadedFileInfo.count} aturan siap di-import
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => {
                        setUploadedFileInfo(null)
                        setFileRules([])
                      }}
                    >
                      Ganti
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between pb-2 border-b text-[11px] font-semibold text-muted-foreground">
                      <span>Pratinjau Data Aturan</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        {fileRules.length} Total
                      </Badge>
                    </div>
                    <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                      {fileRules.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex flex-col gap-1 text-[11px] p-2.5 rounded-lg bg-background border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                {r.trigger_type}
                              </span>
                              <span className="font-semibold text-primary truncate max-w-[200px]">
                                "{r.trigger_value}"
                              </span>
                            </div>
                            {r.recipient_jid?.includes('6285216149732') ? (
                              <Badge variant="outline" className="text-[10px] border-pink-500/40 text-pink-600 bg-pink-500/10">
                                Pacar 🧕
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Global
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground line-clamp-1 text-[11px]">
                            {r.response_content}
                          </p>
                        </div>
                      ))}
                      {fileRules.length > 5 && (
                        <p className="text-[10px] text-center text-muted-foreground pt-1">
                          + {fileRules.length - 5} aturan lainnya dalam berkas ini
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-10 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors text-center"
                >
                  <FileJson className="size-10 text-primary/70 mb-2.5" />
                  <p className="text-sm font-semibold text-foreground">Klik untuk memilih berkas JSON</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                    Mendukung berkas dump hasil AI (misal: 200 aturan chat santai dan pasangan).
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Tempel JSON Array</Label>
                <Textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='[{"trigger_type":"contains","trigger_value":"sayang","recipient_jid":"6285216149732@s.whatsapp.net","response_content":"Iya sayang?","scope":"all"}]'
                  className="h-36 max-h-36 resize-none font-mono text-[11px] rounded-[6px]"
                />
                <span className="text-[11px] text-muted-foreground">
                  {parsePastedData().length > 0
                    ? `${parsePastedData().length} aturan valid terdeteksi`
                    : 'Format JSON array'}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteImport}
              disabled={importMutation.isPending || activeImportRules.length === 0}
              className="h-8 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              {importMutation.isPending ? 'Mengimpor...' : `Import (${activeImportRules.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt AI Dialog - Luas di Desktop */}
      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[85vh] flex flex-col p-0 border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                  Prompt AI 200 Pemicu (Chat Santai & Pasangan)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Gunakan prompt ini pada ChatGPT, Claude, atau DeepSeek bersama berkas zip referensi chat.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="p-4 sm:p-6 flex-1 max-h-[58vh] overflow-y-auto">
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Zap className="size-4 text-amber-500" />
                  <span>Preset 200 Pemicu Teruji</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-md gap-1"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="size-3" />
                    <span>Unduh Template</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-md gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    onClick={handleLoadDefault200Preset}
                    disabled={importMutation.isPending}
                  >
                    <Bot className="size-3" />
                    <span>Muat 200 Preset</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Teks Prompt AI</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2 text-primary"
                    onClick={copyPromptText}
                  >
                    <Copy className="size-3" />
                    <span>Salin</span>
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={MEGA_PROMPT_200_AUTO_REPLIES}
                  className="h-56 max-h-56 resize-none font-mono text-[11px] rounded-[6px] bg-muted/30 leading-relaxed overflow-y-auto"
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5 text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground">Panduan Singkat:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Unggah berkas <code className="font-mono text-primary font-semibold">PENCARI LOKER.zip</code> dan <code className="font-mono text-pink-600 font-semibold">Indah 🧕🌿💝.zip</code> ke ChatGPT / Claude.</li>
                  <li>Tempelkan teks prompt di atas lalu kirim.</li>
                  <li>Simpan hasil JSON yang diberikan AI menjadi berkas <code className="font-mono text-primary">.json</code>.</li>
                  <li>Kembali ke sini, klik <strong>Import</strong> lalu pilih berkas JSON tersebut!</li>
                </ol>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromptOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={copyPromptText}
              className="h-8 gap-1.5 text-xs rounded-[6px] bg-primary text-primary-foreground shadow-xs"
            >
              <Copy className="size-3.5" />
              <span>Salin Prompt</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
