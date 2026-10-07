import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  Eye,
  EyeOff,
  Bot,
  Briefcase,
  Phone,
  MessageSquareQuote,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getAIConfig,
  updateAIConfig,
  listAIPersonas,
  deleteAIPersona,
  type BotAIPersona,
} from '@/api/bot'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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

export default function BotAIPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showKey, setShowKey] = useState(false)

  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('https://router.bynara.id/v1')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('step-5-preview')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [triggerPrefix, setTriggerPrefix] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [accessMode, setAccessMode] = useState<'all' | 'allowlist' | 'blocklist'>('all')
  const [allowedJids, setAllowedJids] = useState('')
  const [blockedJids, setBlockedJids] = useState('')
  const [allowGroups, setAllowGroups] = useState(true)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  const [searchPersona, setSearchPersona] = useState('')
  const [personaToDelete, setPersonaToDelete] = useState<BotAIPersona | null>(null)

  useQuery({
    queryKey: ['bot-ai-config'],
    queryFn: async () => {
      const cfg = await getAIConfig()
      if (!isConfigLoaded && cfg) {
        setProvider(cfg.provider || 'openai')
        setBaseUrl(cfg.base_url || 'https://router.bynara.id/v1')
        setApiKey(cfg.api_key || '')
        setModel(cfg.model || 'step-5-preview')
        setSystemPrompt(cfg.system_prompt || '')
        setTemperature(cfg.temperature ?? 0.7)
        setTriggerPrefix(cfg.trigger_prefix || '')
        setAutoReplyEnabled(cfg.auto_reply_enabled ?? true)
        setAccessMode(cfg.access_mode || 'all')
        setAllowedJids(cfg.allowed_jids || '')
        setBlockedJids(cfg.blocked_jids || '')
        setAllowGroups(cfg.allow_groups ?? true)
        setIsConfigLoaded(true)
      }
      return cfg
    },
  })

  const { data: personas = [], isLoading: isLoadingPersonas } = useQuery({
    queryKey: ['bot-ai-personas'],
    queryFn: listAIPersonas,
  })

  const saveConfigMutation = useMutation({
    mutationFn: () =>
      updateAIConfig({
        provider: provider.trim(),
        base_url: baseUrl.trim(),
        api_key: apiKey.trim(),
        model: model.trim(),
        system_prompt: systemPrompt.trim(),
        temperature: Number(temperature),
        trigger_prefix: triggerPrefix.trim(),
        auto_reply_enabled: autoReplyEnabled,
        access_mode: accessMode,
        allowed_jids: allowedJids.trim(),
        blocked_jids: blockedJids.trim(),
        allow_groups: allowGroups,
      }),
    onSuccess: () => {
      toast.success('Pengaturan AI berhasil diperbarui')
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-config'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan konfigurasi')
    },
  })

  const deletePersonaMutation = useMutation({
    mutationFn: (id: number) => deleteAIPersona(id),
    onSuccess: () => {
      toast.success('Persona berhasil dihapus')
      setPersonaToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-personas'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus persona')
    },
  })

  const filteredPersonas = useMemo(() => {
    if (!searchPersona.trim()) return personas
    const query = searchPersona.toLowerCase().trim()
    return personas.filter(
      (p) =>
        p.phone_number.toLowerCase().includes(query) ||
        p.contact_name.toLowerCase().includes(query) ||
        p.relationship.toLowerCase().includes(query) ||
        p.custom_prompt.toLowerCase().includes(query),
    )
  }, [personas, searchPersona])

  const getRelationshipIcon = (rel: string) => {
    const lower = rel.toLowerCase()
    if (lower.includes('khusus') || lower.includes('prioritas') || lower.includes('kontak')) {
      return <UserCheck className="size-3.5 text-indigo-500 fill-indigo-500/20" />
    }
    if (lower.includes('klien') || lower.includes('bisnis') || lower.includes('kerja')) {
      return <Briefcase className="size-3.5 text-amber-500" />
    }
    return <UserCheck className="size-3.5 text-emerald-500" />
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-6xl mx-auto pb-10">
      <PageHeader
        title="Pengaturan AI & Prompting Nomor"
        description="Kelola konfigurasi model AI, kontrol akses pengirim pesan, dan atur gaya bahasa khusus per kontak dengan Supermemory."
        actions={
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs gap-1.5 py-1 px-2.5 rounded-[5px]"
          >
            <Sparkles className="size-3.5" />
            <span>AI Autonomous Engine</span>
          </Badge>
        }
      />

      <Tabs defaultValue="personas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/60 p-1 rounded-lg">
          <TabsTrigger value="personas" className="gap-2 text-xs font-medium rounded-md py-1.5">
            <Users className="size-3.5" />
            <span>Persona Per Nomor ({personas.length})</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2 text-xs font-medium rounded-md py-1.5">
            <Sliders className="size-3.5" />
            <span>Konfigurasi & Akses</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PERSONA PER NOMOR */}
        <TabsContent value="personas" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-lg border border-border/60">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari"
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
                className="pl-8 h-8 text-xs rounded-md"
              />
            </div>
            <Button
              onClick={() => navigate('/bot/ai/new')}
              size="sm"
              className="h-8 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 active:scale-[0.98] transition-all"
            >
              <Plus className="size-3.5" />
              <span>Baru</span>
            </Button>
          </div>

          {isLoadingPersonas ? (
            <div className="p-12 text-center text-xs text-muted-foreground border rounded-lg">
              Memuat daftar persona...
            </div>
          ) : filteredPersonas.length === 0 ? (
            <Card className="border-dashed border-border/80 bg-card/30 text-center py-12">
              <CardContent className="flex flex-col items-center justify-center gap-2">
                <Bot className="size-10 text-muted-foreground/40" />
                <h3 className="text-sm font-semibold text-foreground">Belum ada persona kustom</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Tambahkan nomor kontak khusus agar AI membalas dengan gaya percakapan santai, luwes, dan menyerap konteks Supermemory.
                </p>
                <Button
                  onClick={() => navigate('/bot/ai/new')}
                  size="sm"
                  className="mt-2 h-8 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>Baru</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonas.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => navigate('/bot/ai/' + p.phone_number)}
                  className={`border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                    p.is_active
                      ? 'border-border/70 bg-card/60 shadow-xs hover:border-emerald-500/40'
                      : 'border-border/40 bg-muted/20 opacity-75'
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-md bg-muted/80 flex items-center justify-center shrink-0 border border-border/50">
                          {getRelationshipIcon(p.relationship)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-semibold text-foreground truncate">
                              {p.contact_name || 'Tanpa Nama'}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 font-normal rounded capitalize border-border/60 bg-muted/40"
                            >
                              {p.relationship || 'umum'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono mt-0.5">
                            <Phone className="size-3" />
                            <span>+{p.phone_number}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/bot/ai/' + p.phone_number)
                          }}
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPersonaToDelete(p)
                          }}
                          className="size-7 rounded-md text-muted-foreground hover:text-rose-500"
                          title="Hapus"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 flex flex-col gap-3">
                    <div className="bg-muted/30 p-2.5 rounded-md border border-border/40 text-[11px] text-muted-foreground line-clamp-3 leading-relaxed font-sans">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-foreground mb-1">
                        <MessageSquareQuote className="size-3 text-emerald-500" />
                        <span>Prompt Instruksi:</span>
                      </div>
                      {p.custom_prompt}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] py-0.5 px-2 rounded-[4px] font-medium ${
                          p.auto_reply_enabled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Auto-Reply: {p.auto_reply_enabled ? 'Aktif' : 'Nonaktif'}
                      </Badge>

                      <Badge
                        variant="secondary"
                        className={`text-[10px] py-0.5 px-2 rounded-[4px] font-medium ${
                          p.use_memory
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Supermemory: {p.use_memory ? 'Tersambung' : 'Mati'}
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0.5 px-2 rounded-[4px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                      >
                        100 Chat History: Aktif
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: KONFIGURASI GLOBAL & AKSES */}
        <TabsContent value="config" className="mt-4 flex flex-col gap-5">
          {/* Card 1: Pengaturan Akses & Keamanan */}
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <CardTitle className="text-sm font-semibold">Aturan Akses Chat AI</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Tentukan siapa saja pengguna WhatsApp yang berhak memicu respon AI bot.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Mode Pembatasan Akses</Label>
                  <Select
                    value={accessMode}
                    onValueChange={(v: 'all' | 'allowlist' | 'blocklist') => setAccessMode(v)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-md">
                      <SelectValue placeholder="Pilih mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        Semua Orang (Kecuali yang diblokir)
                      </SelectItem>
                      <SelectItem value="allowlist" className="text-xs">
                        Hanya Allowlist & Persona Terdaftar
                      </SelectItem>
                      <SelectItem value="blocklist" className="text-xs">
                        Semua Kontak Kecuali Blocklist
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground leading-normal">
                    {accessMode === 'all' &&
                      'AI akan merespon semua pesan pribadi masuk (nomor di Persona selalu dilayani).'}
                    {accessMode === 'allowlist' &&
                      'AI HANYA merespon nomor yang ada di daftar izin atau nomor persona khusus di bawah.'}
                    {accessMode === 'blocklist' &&
                      'AI melayani semua orang, kecuali nomor-nomor yang dicantumkan pada daftar blokir.'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 justify-center bg-muted/30 p-3 rounded-md border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Izinkan AI di Grup WhatsApp</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Aktifkan jika AI diizinkan merespon saat dipanggil dalam obrolan grup.
                      </p>
                    </div>
                    <Switch checked={allowGroups} onCheckedChange={setAllowGroups} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div>
                      <Label className="text-xs font-medium">Auto-Reply Global</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Balas otomatis semua pesan tanpa mewajibkan prefix pemicu.
                      </p>
                    </div>
                    <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                  </div>
                </div>
              </div>

              {accessMode === 'allowlist' && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Daftar Nomor Diizinkan (Allowlist JID / Nomor HP)
                  </Label>
                  <Textarea
                    placeholder="Contoh: 6285216149732, 628123456789 (pisahkan dengan koma atau baris baru)"
                    value={allowedJids}
                    onChange={(e) => setAllowedJids(e.target.value)}
                    className="text-xs font-mono min-h-[60px] rounded-md"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Hanya nomor di atas dan nomor yang memiliki persona kustom yang akan direspon.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <ShieldAlert className="size-3 text-rose-500" />
                  <span>Daftar Nomor Diblokir (Blocklist / Abaikan)</span>
                </Label>
                <Textarea
                  placeholder="Contoh: 628999999999, 628888888888 (pisahkan dengan koma atau baris baru)"
                  value={blockedJids}
                  onChange={(e) => setBlockedJids(e.target.value)}
                  className="text-xs font-mono min-h-[60px] rounded-md"
                />
                <span className="text-[11px] text-muted-foreground">
                  Nomor di daftar ini tidak akan pernah direspon oleh AI dalam kondisi apapun.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pengaturan Provider & Model AI */}
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-emerald-500" />
                <CardTitle className="text-sm font-semibold">Model AI & Kredensial API</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Konfigurasi endpoint LLM OpenAI-compatible, model, dan suhu responsivitas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Provider</Label>
                  <Input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="openai"
                    className="h-9 text-xs rounded-md"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="step-5-preview atau gpt-4o-mini"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Base URL</Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://router.bynara.id/v1"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="h-9 text-xs rounded-md font-mono pr-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground"
                    >
                      {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Suhu Responsivitas (Temperature)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">
                    Prefix Pemicu (Kosongkan jika auto-reply tanpa prefix)
                  </Label>
                  <Input
                    value={triggerPrefix}
                    onChange={(e) => setTriggerPrefix(e.target.value)}
                    placeholder="Contoh: !ai (opsional)"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">
                  System Prompt Default (Untuk Kontak Umum Non-Persona)
                </Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Kamu adalah asisten pribadi yang membalas chat WhatsApp dengan bahasa santai, to the point, dan manusiawi..."
                  className="text-xs min-h-[90px] rounded-md leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                  size="sm"
                  className="h-9 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-5 active:scale-[0.98] transition-all"
                >
                  <Save className="size-3.5" />
                  <span>
                    {saveConfigMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Konfigurasi'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!personaToDelete}
        onOpenChange={(open) => !open && setPersonaToDelete(null)}
      >
        <AlertDialogContent className="p-5 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Hapus Persona</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Hapus konfigurasi AI untuk {personaToDelete?.contact_name || personaToDelete?.phone_number}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-8 text-xs rounded-md">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => personaToDelete && deletePersonaMutation.mutate(personaToDelete.id)}
              className="h-8 text-xs rounded-md bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
