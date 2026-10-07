import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Edit,
  Eye,
  FileJson,
  LayoutGrid,
  List,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  bulkDeleteRules,
  clearAllRules,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

export const parseRecipientNumbers = (recipientJid?: string): string[] => {
  if (!recipientJid) return []
  const clean = recipientJid.trim()
  if (!clean || clean === 'all' || clean === 'global') return []
  return clean
    .split(/[\n,;\s|]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
}

export const isSpecialRule = (rule: BotRule): boolean => {
  const clean = rule.recipient_jid?.trim()
  return !!clean && clean !== 'all' && clean !== 'global'
}

export const isGlobalRule = (rule: BotRule): boolean => {
  const clean = rule.recipient_jid?.trim()
  return !clean || clean === 'all' || clean === 'global'
}

export default function BotAutoRepliesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState<'all' | 'special' | 'global'>('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'private' | 'group'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'list'
    }
    return 'grid'
  })

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

  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([])
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  const [recipientTargetType, setRecipientTargetType] = useState<'global' | 'special'>('global')
  const [specialRecipientPhones, setSpecialRecipientPhones] = useState('')
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

  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

  const specialCount = rules.filter(isSpecialRule).length
  const globalCount = rules.filter(isGlobalRule).length

  const filteredRules = rules.filter((rule) => {
    if (targetFilter === 'special') return isSpecialRule(rule)
    if (targetFilter === 'global') return isGlobalRule(rule)
    return true
  })

  const totalItems = filteredRules.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems)
  const paginatedRules = filteredRules.slice(startIndex, endIndex)

  const toggleSelectRule = (id: number) => {
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const isAllCurrentPageSelected =
    paginatedRules.length > 0 && paginatedRules.every((r) => selectedRuleIds.includes(r.id))

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedRules.map((r) => r.id))
      setSelectedRuleIds((prev) => prev.filter((id) => !pageIds.has(id)))
    } else {
      const pageIds = paginatedRules.map((r) => r.id)
      setSelectedRuleIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalRecipient: string | undefined = undefined
      if (recipientTargetType === 'special') {
        finalRecipient = specialRecipientPhones.trim() || undefined
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

  const clearAllMutation = useMutation({
    mutationFn: clearAllRules,
    onSuccess: () => {
      toast.success('Semua aturan berhasil dihapus!')
      setSelectedRuleIds([])
      setResetConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mereset aturan')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteRules(ids),
    onSuccess: (res) => {
      toast.success(`${res.deleted_count || selectedRuleIds.length} aturan terpilih berhasil dihapus!`)
      setSelectedRuleIds([])
      setBulkDeleteConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus aturan terpilih')
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
    setSpecialRecipientPhones('')
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
    if (isSpecialRule(rule)) {
      setRecipientTargetType('special')
      setSpecialRecipientPhones(rule.recipient_jid || '')
    } else {
      setRecipientTargetType('global')
      setSpecialRecipientPhones('')
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
              variant="destructive"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
              disabled={clearAllMutation.isPending || rules.length === 0}
              title="Hapus seluruh data balasan otomatis dari database"
              className="h-8 gap-1.5 rounded-[6px] text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs shadow-rose-500/20"
            >
              <Trash2 className="size-3.5" />
              <span>Hapus Semua Data ({rules.length})</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setTargetFilter('all')
            setCurrentPage(1)
          }}
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
          onClick={() => {
            setTargetFilter('special')
            setCurrentPage(1)
          }}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'special'
              ? 'border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <PhoneCall className="size-3 text-indigo-500" />
              <span>Nomor Khusus</span>
            </span>
            <span className="text-base font-bold text-foreground">{specialCount}</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5">
            Target Khusus
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setTargetFilter('global')
            setCurrentPage(1)
          }}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'global'
              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">Global</span>
            <span className="text-base font-bold text-foreground">{globalCount}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">🌐 Semua Kontak</Badge>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari pemicu atau respons"
              className="h-8 pl-8 text-xs rounded-[6px]"
            />
          </div>
          <Select
            value={targetFilter}
            onValueChange={(val) => {
              setTargetFilter(val as 'all' | 'special' | 'global')
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[145px] text-xs rounded-[6px]">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Target</SelectItem>
              <SelectItem value="special">Nomor Khusus 🎯</SelectItem>
              <SelectItem value="global">Global 🌐</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={scopeFilter}
            onValueChange={(val) => {
              setScopeFilter(val as 'all' | 'private' | 'group')
              setCurrentPage(1)
            }}
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
            onValueChange={(val) => {
              setActiveFilter(val as 'all' | 'true' | 'false')
              setCurrentPage(1)
            }}
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
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 sm:ml-auto">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-7 px-2.5 rounded-[5px] text-xs gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
              title="Tampilan Grid"
            >
              <LayoutGrid className="size-3.5" />
              <span>Grid</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-7 px-2.5 rounded-[5px] text-xs gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
              title="Tampilan List"
            >
              <List className="size-3.5" />
              <span>List</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredRules.length === 0 && !isLoading ? (
        <EmptyState
          icon={Bot}
          title="Tidak Ada Aturan"
          hint={
            targetFilter === 'special'
              ? 'Belum ada aturan untuk Nomor Khusus. Klik tombol Baru untuk membuat aturan khusus.'
              : 'Tidak ada aturan balasan otomatis yang sesuai filter.'
          }
          action={
            <div className="flex items-center gap-2">
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
        <>
          {selectedRuleIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border border-primary/40 bg-primary/10 shadow-xs text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-mono">{selectedRuleIds.length}</Badge>
                <span className="font-semibold text-foreground">aturan dipilih dari total {rules.length} aturan</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRuleIds([])}
                  className="h-7 text-xs px-2"
                >
                  Batal
                </Button>
                {selectedRuleIds.length < rules.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRuleIds(rules.map((r) => r.id))}
                    className="h-7 text-xs px-2.5"
                  >
                    Pilih Semua ({rules.length})
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  disabled={bulkDeleteMutation.isPending}
                  className="h-7 text-xs px-2.5 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus Terpilih ({selectedRuleIds.length})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={clearAllMutation.isPending}
                  className="h-7 text-xs px-2.5 gap-1.5 text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus Semua ({rules.length})</span>
                </Button>
              </div>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 py-0.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-medium select-none">
                  <Checkbox
                    checked={isAllCurrentPageSelected}
                    onCheckedChange={toggleSelectAllCurrentPage}
                    aria-label="Pilih semua pada halaman ini"
                    className="size-3.5 sm:size-4 rounded-[4px]"
                  />
                  <span>Pilih semua di halaman ini ({paginatedRules.length})</span>
                </label>
                <span className="text-muted-foreground text-[11px] font-mono">
                  Hal {safeCurrentPage} dari {totalPages}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {paginatedRules.map((rule) => {
                  const special = isSpecialRule(rule)
                  const isSelected = selectedRuleIds.includes(rule.id)
                  const parsedNumbers = parseRecipientNumbers(rule.recipient_jid)
                  return (
                    <Card
                      key={rule.id}
                      className={`flex flex-col justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                          : 'border-border/60 bg-card/50 hover:border-primary/30 hover:bg-card/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRule(rule.id)}
                              aria-label={`Pilih aturan ${rule.id}`}
                              className="size-3.5 sm:size-4 rounded-[4px]"
                            />
                            {special ? (
                              <Badge
                                variant="outline"
                                className="border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 gap-1 text-[10px] px-1.5 py-0 font-medium truncate max-w-[80px] sm:max-w-none"
                              >
                                <PhoneCall className="size-2.5 shrink-0" />
                                <span className="truncate">Khusus{parsedNumbers.length > 0 ? ` (${parsedNumbers.length})` : ''}</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
                                🌐 Global
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleMutation.mutate(rule.id)}
                            className="scale-75 sm:scale-90 origin-right data-[state=checked]:bg-red-600 shrink-0"
                          />
                        </div>

                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Pemicu</span>
                          <div
                            className="font-mono text-xs font-bold text-foreground bg-muted/50 border border-border/40 rounded-[5px] px-2 py-1 truncate"
                            title={rule.trigger_value}
                          >
                            "{rule.trigger_value}"
                          </div>
                        </div>

                        <div className="space-y-1 mb-2.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Balasan</span>
                          <p
                            className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words"
                            title={rule.response_content}
                          >
                            {rule.response_content}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1 mt-auto">
                        <span className="text-[10px] font-mono text-muted-foreground/80">#{rule.id}</span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 sm:size-7 rounded-[5px] text-primary hover:bg-primary/10"
                            onClick={() => openDetailDialog(rule)}
                            title="Lihat Detail & Nomor"
                          >
                            <Eye className="size-3 sm:size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 sm:size-7 rounded-[5px] text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(rule)}
                            title="Edit"
                          >
                            <Edit className="size-3 sm:size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 sm:size-7 rounded-[5px] text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm('Hapus aturan ini?')) {
                                deleteMutation.mutate(rule.id)
                              }
                            }}
                            title="Hapus"
                          >
                            <Trash2 className="size-3 sm:size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[45px] text-center">
                        <Checkbox
                          checked={isAllCurrentPageSelected}
                          onCheckedChange={toggleSelectAllCurrentPage}
                          aria-label="Pilih semua baris pada halaman ini"
                        />
                      </TableHead>
                      <TableHead className="w-[180px] text-xs font-semibold">Pemicu</TableHead>
                      <TableHead className="text-xs font-semibold">Pesan Balasan</TableHead>
                      <TableHead className="w-[160px] text-xs font-semibold">Target</TableHead>
                      <TableHead className="w-[70px] text-center text-xs font-semibold">Aktif</TableHead>
                      <TableHead className="w-[110px] text-right text-xs font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRules.map((rule) => {
                      const special = isSpecialRule(rule)
                      const isSelected = selectedRuleIds.includes(rule.id)
                      const parsedNumbers = parseRecipientNumbers(rule.recipient_jid)
                      return (
                        <TableRow
                          key={rule.id}
                          className={`transition-colors hover:bg-muted/20 ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRule(rule.id)}
                              aria-label={`Pilih aturan ${rule.id}`}
                            />
                          </TableCell>

                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            "{rule.trigger_value}"
                          </TableCell>

                          <TableCell className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {rule.response_content}
                          </TableCell>

                          <TableCell>
                            {special ? (
                              <Badge
                                variant="outline"
                                className="border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 gap-1 text-[11px] font-medium"
                              >
                                <PhoneCall className="size-3" />
                                <span>
                                  Nomor Khusus{parsedNumbers.length > 0 ? ` (${parsedNumbers.length})` : ''}
                                </span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[11px] font-normal text-muted-foreground">
                                🌐 Global
                              </Badge>
                            )}
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
                                className="size-7 rounded-[5px] text-primary hover:bg-primary/10"
                                onClick={() => openDetailDialog(rule)}
                                title="Lihat Detail & Nomor"
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
              </div>
            </Card>
          )}
        </>
      )}

      {/* Pagination Toolbar */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-xs">
          <p className="text-muted-foreground text-xs font-medium">
            Menampilkan <span className="font-semibold text-foreground">{startIndex + 1}</span>–
            <span className="font-semibold text-foreground">{endIndex}</span> dari{' '}
            <span className="font-semibold text-foreground">{totalItems}</span> aturan
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="h-8 w-8 p-0 rounded-[6px]"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-[6px] gap-1 text-xs"
            >
              <ChevronLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </Button>

            <div className="flex items-center px-2.5 py-1 rounded-[6px] border bg-muted/30 font-mono text-xs">
              <span className="font-semibold text-foreground">{safeCurrentPage}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-muted-foreground">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-[6px] gap-1 text-xs"
            >
              <span>Berikutnya</span>
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="h-8 w-8 p-0 rounded-[6px]"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
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
              <div className="rounded-lg border bg-muted/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      isSpecialRule(selectedDetailRule)
                        ? 'bg-amber-500/10 text-amber-500'
                        : isGlobalRule(selectedDetailRule)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-sky-500/10 text-sky-500'
                    }`}
                  >
                    {isSpecialRule(selectedDetailRule) ? (
                      <PhoneCall className="size-5" />
                    ) : (
                      <Bot className="size-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Target Penerima</p>
                    <p className="text-sm font-bold text-foreground">
                      {isSpecialRule(selectedDetailRule)
                        ? `Nomor Khusus (${parseRecipientNumbers(selectedDetailRule.recipient_jid).length} nomor terdaftar)`
                        : 'Global (Semua Kontak & Grup)'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isSpecialRule(selectedDetailRule)
                        ? 'Hanya merespon pesan dari nomor-nomor khusus yang terdaftar di bawah.'
                        : 'Merespon pesan dari seluruh nomor kontak dan grup WhatsApp.'}
                    </p>
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

              {isSpecialRule(selectedDetailRule) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <PhoneCall className="size-3.5 text-indigo-500" />
                      <span>
                        Daftar Nomor WhatsApp Target ({parseRecipientNumbers(selectedDetailRule.recipient_jid).length} Nomor)
                      </span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2 text-primary hover:bg-primary/10"
                      onClick={() => {
                        const nums = parseRecipientNumbers(selectedDetailRule.recipient_jid).join('\n')
                        void navigator.clipboard.writeText(nums)
                        toast.success('Daftar nomor berhasil disalin!')
                      }}
                    >
                      <Copy className="size-3" />
                      <span>Salin Semua Nomor</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border bg-background max-h-40 overflow-y-auto">
                    {parseRecipientNumbers(selectedDetailRule.recipient_jid).map((num, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-foreground font-mono text-[11px] font-semibold border"
                      >
                        <span className="text-indigo-500 text-[10px]">#</span>
                        <span>{num}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
            <div className="space-y-2.5 p-3.5 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold text-foreground">Target Penerima (Filter Nomor)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    Semua kontak & grup WhatsApp
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientTargetType('special')}
                  className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                    recipientTargetType === 'special'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/40'
                      : 'border-border/70 bg-background hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <PhoneCall className="size-3 text-indigo-500" />
                    <span>Nomor Khusus 🎯</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    1 template bisa dipakai 1 - 100 nomor
                  </span>
                </button>
              </div>

              {recipientTargetType === 'special' && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Daftar Nomor WhatsApp Target</Label>
                    <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                      {parseRecipientNumbers(specialRecipientPhones).length} nomor terdeteksi
                    </Badge>
                  </div>
                  <Textarea
                    value={specialRecipientPhones}
                    onChange={(e) => setSpecialRecipientPhones(e.target.value)}
                    placeholder="Contoh: 6281234567890, 6289876543210&#10;Atau baris baru:&#10;628111111111&#10;628222222222"
                    className="h-24 max-h-36 resize-none text-xs rounded-[6px] font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan kode negara (misal 628...). Pisahkan dengan koma atau enter. 1 template balasan ini bisa dipakai untuk banyak nomor sekaligus.
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
                            {r.recipient_jid?.trim() && r.recipient_jid !== 'global' && r.recipient_jid !== 'all' ? (
                              <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-indigo-600 bg-indigo-500/10">
                                Nomor Khusus 🎯
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
                    Mendukung berkas dump hasil AI (misal: 200 aturan chat santai & nomor khusus).
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Tempel JSON Array</Label>
                <Textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='[{"trigger_type":"contains","trigger_value":"info promo","recipient_jid":"6281234567890,6289876543210","response_content":"Promo saat ini sedang aktif ya!","scope":"all"}]'
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
                  Prompt AI 200 Pemicu (Chat Santai & Nomor Khusus)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Gunakan prompt ini pada ChatGPT, Claude, atau DeepSeek bersama data referensi chat.
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
                  <li>Unggah berkas riwayat obrolan santai ke ChatGPT / Claude.</li>
                  <li>Tempelkan teks prompt di atas lalu kirim.</li>
                  <li>Simpan hasil JSON yang diberikan AI menjadi berkas <code className="font-mono text-primary">.json</code>.</li>
                  <li>Kembali ke sini, klik <strong>Import</strong> lalu pilih berkas JSON tersebut, atau klik <strong>Muat 200 Preset</strong> di atas!</li>
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

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-border/80 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Hapus Semua {rules.length} Data Balasan Otomatis?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Tindakan ini akan menghapus <strong>seluruh {rules.length} data balasan otomatis</strong> dari database secara permanen. Semua data kata kunci pemicu dan respons akan dihapus bersih. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-[6px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="h-8 text-xs rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {clearAllMutation.isPending ? 'Menghapus Semua...' : `Ya, Hapus Semua (${rules.length}) Data`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-border/80 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Hapus {selectedRuleIds.length} Aturan Terpilih?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Apakah Anda yakin ingin menghapus <strong>{selectedRuleIds.length} aturan</strong> yang telah dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-[6px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(selectedRuleIds)}
              disabled={bulkDeleteMutation.isPending}
              className="h-8 text-xs rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? 'Menghapus...' : `Ya, Hapus (${selectedRuleIds.length}) Aturan`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
