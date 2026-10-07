import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Save,
  Sliders,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { useDevices } from '@/hooks/use-devices'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { useDeviceStore } from '@/stores/device'
import {
  BOT_FEATURES,
  DEFAULT_QUOTES,
  getStoredFeatureConfig,
  saveStoredFeatureConfig,
  type QuoteItem,
  type StoredFeatureConfig,
} from '@/lib/bot-features-data'

export default function BotMenuDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const selectedDeviceId = useSelectedDevice()
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const { data: devices = [] } = useDevices()

  const feature = BOT_FEATURES.find((f) => f.id === id)

  const [command, setCommand] = useState('')
  const [alias, setAlias] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [autoTyping, setAutoTyping] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [exampleInput, setExampleInput] = useState('')
  const [exampleOutput, setExampleOutput] = useState('')
  const [applyToAllDevices, setApplyToAllDevices] = useState(true)

  const [weatherApiKey, setWeatherApiKey] = useState('')
  const [weatherCity, setWeatherCity] = useState('Jakarta')
  const [weatherProvider, setWeatherProvider] = useState('bmkg')

  const [newsApiKey, setNewsApiKey] = useState('')
  const [newsCategory, setNewsCategory] = useState('nasional')
  const [newsProvider, setNewsProvider] = useState('newsapi')

  const [quotes, setQuotes] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('bot_quotes_db_v1')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return DEFAULT_QUOTES
  })
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('')

  const [dirCheckNum, setDirCheckNum] = useState(true)
  const [dirUserInfo, setDirUserInfo] = useState(true)
  const [dirAvatar, setDirAvatar] = useState(true)
  const [dirBusiness, setDirBusiness] = useState(true)

  const [antiLinkAction, setAntiLinkAction] = useState('delete')
  const [antiLinkWhitelist, setAntiLinkWhitelist] = useState('')

  const [welcomeTpl, setWelcomeTpl] = useState(
    'Selamat datang {name} di grup {group}! Silakan baca deskripsi ya.',
  )
  const [farewellTpl, setFarewellTpl] = useState(
    'Sampai jumpa {name}, terima kasih telah bergabung.',
  )

  useEffect(() => {
    if (!feature) return
    const cfg = getStoredFeatureConfig(feature.id, selectedDeviceId)
    setCommand(cfg.command || feature.command)
    setAlias(cfg.alias || feature.alias || '')
    setIsActive(cfg.isActive ?? true)
    setAutoTyping(cfg.autoTyping ?? feature.autoTyping ?? false)
    setInstruction(cfg.instruction || feature.instruction)
    setExampleInput(cfg.exampleInput || feature.exampleInput)
    setExampleOutput(cfg.exampleOutput || feature.exampleOutput)

    if (cfg.custom) {
      if (cfg.custom.weatherApiKey !== undefined) setWeatherApiKey(cfg.custom.weatherApiKey)
      if (cfg.custom.weatherCity !== undefined) setWeatherCity(cfg.custom.weatherCity)
      if (cfg.custom.weatherProvider !== undefined) setWeatherProvider(cfg.custom.weatherProvider)
      if (cfg.custom.newsApiKey !== undefined) setNewsApiKey(cfg.custom.newsApiKey)
      if (cfg.custom.newsCategory !== undefined) setNewsCategory(cfg.custom.newsCategory)
      if (cfg.custom.newsProvider !== undefined) setNewsProvider(cfg.custom.newsProvider)
      if (cfg.custom.dirCheckNum !== undefined) setDirCheckNum(cfg.custom.dirCheckNum)
      if (cfg.custom.dirUserInfo !== undefined) setDirUserInfo(cfg.custom.dirUserInfo)
      if (cfg.custom.dirAvatar !== undefined) setDirAvatar(cfg.custom.dirAvatar)
      if (cfg.custom.dirBusiness !== undefined) setDirBusiness(cfg.custom.dirBusiness)
      if (cfg.custom.antiLinkAction !== undefined) setAntiLinkAction(cfg.custom.antiLinkAction)
      if (cfg.custom.antiLinkWhitelist !== undefined) setAntiLinkWhitelist(cfg.custom.antiLinkWhitelist)
      if (cfg.custom.welcomeTpl !== undefined) setWelcomeTpl(cfg.custom.welcomeTpl)
      if (cfg.custom.farewellTpl !== undefined) setFarewellTpl(cfg.custom.farewellTpl)
    }
  }, [feature, selectedDeviceId])

  if (!feature) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center space-y-3">
        <h2 className="text-base font-bold text-foreground">Fitur tidak ditemukan</h2>
        <Button size="sm" onClick={() => navigate('/bot/menu')}>
          Kembali
        </Button>
      </div>
    )
  }

  const FeatureIcon = feature.icon

  const handleSave = () => {
    const updated: StoredFeatureConfig = {
      command: command.trim(),
      alias: alias.trim(),
      isActive,
      autoTyping,
      instruction: instruction.trim(),
      exampleInput: exampleInput.trim(),
      exampleOutput: exampleOutput.trim(),
      custom: {
        weatherApiKey: weatherApiKey.trim(),
        weatherCity: weatherCity.trim(),
        weatherProvider,
        newsApiKey: newsApiKey.trim(),
        newsCategory,
        newsProvider,
        dirCheckNum,
        dirUserInfo,
        dirAvatar,
        dirBusiness,
        antiLinkAction,
        antiLinkWhitelist: antiLinkWhitelist.trim(),
        welcomeTpl: welcomeTpl.trim(),
        farewellTpl: farewellTpl.trim(),
      },
    }

    saveStoredFeatureConfig(feature.id, updated, selectedDeviceId, applyToAllDevices)
    toast.success('Pengaturan disimpan')
    navigate('/bot/menu')
  }

  const handleResetToDefault = () => {
    setCommand(feature.command)
    setAlias(feature.alias || '')
    setIsActive(true)
    setAutoTyping(feature.autoTyping)
    setInstruction(feature.instruction)
    setExampleInput(feature.exampleInput)
    setExampleOutput(feature.exampleOutput)
    toast.success('Direset ke default')
  }

  const handleAddQuote = () => {
    if (!newQuoteText.trim()) {
      toast.error('Kutipan kosong')
      return
    }
    const item: QuoteItem = {
      id: Date.now().toString(),
      quote: newQuoteText.trim(),
      author: newQuoteAuthor.trim() || 'Anonim',
    }
    const updated = [item, ...quotes]
    setQuotes(updated)
    try {
      localStorage.setItem('bot_quotes_db_v1', JSON.stringify(updated))
    } catch {
      // ignore
    }
    setNewQuoteText('')
    setNewQuoteAuthor('')
    toast.success('Kutipan ditambahkan')
  }

  const handleDeleteQuote = (quoteId: string) => {
    const updated = quotes.filter((q) => q.id !== quoteId)
    setQuotes(updated)
    try {
      localStorage.setItem('bot_quotes_db_v1', JSON.stringify(updated))
    } catch {
      // ignore
    }
    toast.success('Kutipan dihapus')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-12">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bot/menu')}
            className="h-8 w-8 shrink-0 rounded-[6px]"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-[6px] bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <FeatureIcon className="size-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {feature.name}
            </h1>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="text-[10px] shrink-0 font-medium px-1.5 py-0 rounded-[4px]"
            >
              {isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="h-8 px-2.5 text-xs rounded-[6px]"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/bot/menu')}
            className="h-8 px-2.5 text-xs rounded-[6px]"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="h-8 gap-1.5 px-3 bg-red-600 text-xs text-white hover:bg-red-700 rounded-[6px] shadow-xs font-medium"
          >
            <Save className="size-3.5" />
            <span>Simpan</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <span>Instruksi & Cara Kerja</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
              <div className="space-y-1.5">
                <Label htmlFor="inst-input" className="text-xs font-semibold text-foreground">
                  Instruksi Bot
                </Label>
                <Textarea
                  id="inst-input"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Instruksi"
                  rows={5}
                  className="text-xs leading-relaxed font-sans rounded-[6px] resize-y"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cmd-input" className="text-xs font-semibold text-foreground">
                    Perintah Utama
                  </Label>
                  <Input
                    id="cmd-input"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Perintah"
                    className="h-9 font-mono text-xs rounded-[6px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alias-input" className="text-xs font-semibold text-foreground">
                    Alias Perintah
                  </Label>
                  <Input
                    id="alias-input"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Alias"
                    className="h-9 text-xs rounded-[6px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="input-ex" className="text-xs font-semibold text-foreground">
                    Contoh Input
                  </Label>
                  <Input
                    id="input-ex"
                    value={exampleInput}
                    onChange={(e) => setExampleInput(e.target.value)}
                    placeholder="Input"
                    className="h-9 font-mono text-xs rounded-[6px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="output-ex" className="text-xs font-semibold text-foreground">
                    Format Output
                  </Label>
                  <Textarea
                    id="output-ex"
                    value={exampleOutput}
                    onChange={(e) => setExampleOutput(e.target.value)}
                    placeholder="Output"
                    rows={3}
                    className="text-xs font-mono rounded-[6px] resize-y"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {feature.id === 'weather' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Prakiraan BMKG</CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                    Bebas Kuota
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="text-foreground">BMKG Indonesia (Resmi)</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">API:</span>
                    <span className="text-foreground">api.bmkg.go.id (Tanpa Kunci)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Kota Default</Label>
                    <Input
                      value={weatherCity}
                      onChange={(e) => setWeatherCity(e.target.value)}
                      placeholder="Jakarta"
                      className="h-9 text-xs rounded-[6px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Format Wilayah</Label>
                    <Input
                      readOnly
                      value="Nama Kota / Kode adm4"
                      className="h-9 text-xs rounded-[6px] bg-muted/30 text-muted-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'news' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Konfigurasi Berita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">API Key</Label>
                  <Input
                    value={newsApiKey}
                    onChange={(e) => setNewsApiKey(e.target.value)}
                    placeholder="Kunci"
                    className="h-9 font-mono text-xs rounded-[6px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Kategori Default</Label>
                    <Select value={newsCategory} onValueChange={setNewsCategory}>
                      <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nasional">Nasional</SelectItem>
                        <SelectItem value="teknologi">Teknologi</SelectItem>
                        <SelectItem value="bisnis">Bisnis</SelectItem>
                        <SelectItem value="olahraga">Olahraga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Provider</Label>
                    <Select value={newsProvider} onValueChange={setNewsProvider}>
                      <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsapi">NewsAPI</SelectItem>
                        <SelectItem value="rss">RSS Portal</SelectItem>
                        <SelectItem value="ai">AI Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'directory' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Layanan Direktori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-5 pb-5">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Cek Nomor</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Periksa pendaftaran nomor di WhatsApp (!cek).
                    </span>
                  </div>
                  <Switch checked={dirCheckNum} onCheckedChange={setDirCheckNum} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Info Pengguna</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Tampilkan JID, LID, dan status publik (!info).
                    </span>
                  </div>
                  <Switch checked={dirUserInfo} onCheckedChange={setDirUserInfo} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Foto Profil</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Ambil foto profil avatar WhatsApp (!avatar).
                    </span>
                  </div>
                  <Switch checked={dirAvatar} onCheckedChange={setDirAvatar} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Profil Bisnis</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Katalog dan kategori WhatsApp Business (!bisnis).
                    </span>
                  </div>
                  <Switch checked={dirBusiness} onCheckedChange={setDirBusiness} />
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'quote' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Database Kata Mutiara</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Input
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    placeholder="Kutipan"
                    className="h-8 text-xs rounded-md"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      placeholder="Penulis"
                      className="h-8 text-xs rounded-md flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddQuote}
                      className="h-8 px-3 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="size-3.5" />
                      <span>Tambah</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-card/40 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="italic text-foreground line-clamp-2">"{q.quote}"</p>
                        <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                          — {q.author}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuote(q.id)}
                        className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'antilink' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Aturan Anti-Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tindakan</Label>
                  <Select value={antiLinkAction} onValueChange={setAntiLinkAction}>
                    <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Tindakan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">Hapus Pesan</SelectItem>
                      <SelectItem value="kick">Keluarkan Pengirim</SelectItem>
                      <SelectItem value="warn">Peringatan Saja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Whitelist Domain</Label>
                  <Textarea
                    value={antiLinkWhitelist}
                    onChange={(e) => setAntiLinkWhitelist(e.target.value)}
                    placeholder="Domain"
                    rows={2}
                    className="text-xs font-mono rounded-[6px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'welcome-farewell' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Template Grup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Template Sambutan</Label>
                  <Textarea
                    value={welcomeTpl}
                    onChange={(e) => setWelcomeTpl(e.target.value)}
                    placeholder="Sambutan"
                    rows={2}
                    className="text-xs rounded-[6px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Template Pamitan</Label>
                  <Textarea
                    value={farewellTpl}
                    onChange={(e) => setFarewellTpl(e.target.value)}
                    placeholder="Pamitan"
                    rows={2}
                    className="text-xs rounded-[6px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Status Fitur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Aktifkan Fitur
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Respon perintah di chat.
                  </span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Auto-Typing
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Simulasi mengetik sebelum balas.
                  </span>
                </div>
                <Switch
                  checked={autoTyping}
                  onCheckedChange={setAutoTyping}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="size-3.5 text-primary" />
                <span>Multi-Akun</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Akun Saat Ini</Label>
                {devices.length > 0 ? (
                  <Select
                    value={selectedDeviceId || devices[0]?.id || ''}
                    onValueChange={(val) => selectDevice(val)}
                  >
                    <SelectTrigger className="h-8.5 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.display_name || d.id} ({d.phone_number || 'Aktif'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-[11px] text-muted-foreground p-2 rounded-md bg-muted/30 border border-border/40">
                    Belum ada akun WhatsApp terhubung.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold block cursor-pointer">
                    Semua Akun
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Terapkan seragam ke seluruh sesi.
                  </span>
                </div>
                <Switch
                  checked={applyToAllDevices}
                  onCheckedChange={setApplyToAllDevices}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground">
                Informasi Sistem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>ID</span>
                <span className="font-mono text-foreground">{feature.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Kategori</span>
                <span className="text-foreground">{feature.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Provider</span>
                <span className="text-foreground truncate max-w-[140px] text-right">
                  {feature.provider}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Latensi</span>
                <span className="text-foreground">{feature.latency}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
