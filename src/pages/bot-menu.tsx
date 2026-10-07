import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Bot,
  Brain,
  Calculator,
  CalendarClock,
  Check,
  Clock,
  CloudSun,
  Copy,
  ExternalLink,
  MessageSquare,
  Newspaper,
  Plus,
  Quote,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

export type BotCategory = 'all' | 'AI & Memori' | 'Produktivitas' | 'Grup' | 'Sistem'

export interface BotFeature {
  id: string
  name: string
  command: string
  alias?: string
  category: 'AI & Memori' | 'Produktivitas' | 'Grup' | 'Sistem'
  provider: string
  apiStatus: string
  endpoint: string
  model?: string
  shortDesc: string
  fullDesc: string
  exampleInput: string
  exampleOutput: string
  parameters: string[]
  latency: string
  autoTyping: boolean
  icon: typeof Sparkles
  isConfigurable?: boolean
}

export interface QuoteItem {
  id: string
  quote: string
  author: string
}

const DEFAULT_QUOTES: QuoteItem[] = [
  {
    id: '1',
    quote: 'Kesuksesan berawal dari langkah kecil yang konsisten setiap hari.',
    author: 'Eka Syarif',
  },
  {
    id: '2',
    quote: 'Hari ini adalah kesempatan terbaik untuk menjadi lebih baik dari kemarin.',
    author: 'Anonim',
  },
  {
    id: '3',
    quote: 'Fokus pada proses, hasil terbaik akan mengikuti dengan sendirinya.',
    author: 'Pribadi',
  },
  {
    id: '4',
    quote: 'Jangan menunggu waktu yang sempurna, mulailah sekarang dan sempurnakan jalannya.',
    author: 'Inspirasi',
  },
]

const BOT_FEATURES: BotFeature[] = [
  {
    id: 'ai-chat',
    name: 'Asisten AI',
    command: '!ai <pesan>',
    alias: '/ai, percakapan langsung',
    category: 'AI & Memori',
    provider: 'Bynara API (Gratis)',
    apiStatus: 'Online • Bebas Kuota',
    endpoint: 'https://router.bynara.id/v1/chat/completions',
    model: 'step-5-preview',
    shortDesc: 'Asisten percakapan cerdas dengan konteks riwayat obrolan.',
    fullDesc:
      'Engine AI pintar model step-5-preview dengan kepribadian santai, ramah, dan manusiawi. Mengenali identitas username WhatsApp secara langsung serta menyerap konteks riwayat percakapan.',
    exampleInput: '!ai halo kamu kenal aku gak?',
    exampleOutput: 'Halo! Iya kenal dong, kamu {nama}. Ada yang bisa kubantu?',
    parameters: [
      '<pesan> (Pertanyaan atau perintah)',
      '100 pesan riwayat chat terakhir',
      'Username WhatsApp pengirim',
    ],
    latency: '400 - 900 ms',
    autoTyping: true,
    icon: Sparkles,
    isConfigurable: true,
  },
  {
    id: 'weather',
    name: 'Prakiraan Cuaca',
    command: '!cuaca <kota>',
    alias: '/cuaca, !weather',
    category: 'Produktivitas',
    provider: 'OpenWeather / BMKG',
    apiStatus: 'Aktif • Siap Pakai',
    endpoint: 'https://api.openweathermap.org/data/2.5/weather',
    shortDesc: 'Menampilkan prakiraan kondisi cuaca, suhu, dan kelembaban wilayah.',
    fullDesc:
      'Layanan info cuaca real-time untuk seluruh kota dan kabupaten di Indonesia. Menampilkan data suhu terkini, kelembaban udara, kecepatan angin, dan ramalan cuaca hari ini.',
    exampleInput: '!cuaca Jakarta',
    exampleOutput:
      '🌤️ *CUACA JAKARTA*\nSuhu: 29°C\nKondisi: Cerah Berawan\nKelembaban: 72%\nAngin: 12 km/jam',
    parameters: ['<kota> (Nama kota atau kabupaten)'],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: CloudSun,
    isConfigurable: true,
  },
  {
    id: 'news',
    name: 'Berita Terkini',
    command: '!berita <topik>',
    alias: '/berita, !news',
    category: 'Produktivitas',
    provider: 'NewsAPI / RSS Portal',
    apiStatus: 'Aktif • Siap Pakai',
    endpoint: 'https://newsapi.org/v2/top-headlines',
    shortDesc: 'Menyajikan headline berita terhangat nasional, teknologi, dan bisnis.',
    fullDesc:
      'Mengambil intisari berita teraktual dari berbagai portal berita terpercaya secara berkala berdasarkan topik yang diminta pengguna.',
    exampleInput: '!berita teknologi',
    exampleOutput:
      '📰 *BERITA TEKNOLOGI TERKINI*\n1. Inovasi AI Terbaru Resmi Meluncur...\n2. Perkembangan Satelit Komunikasi Nasional...',
    parameters: ['<topik> (Pilihan: nasional, teknologi, bisnis, olahraga)'],
    latency: '200 - 450 ms',
    autoTyping: false,
    icon: Newspaper,
    isConfigurable: true,
  },
  {
    id: 'quote',
    name: 'Kata Mutiara',
    command: '!quote',
    alias: '/quote',
    category: 'Produktivitas',
    provider: 'Database Kata Bijak',
    apiStatus: 'Aktif • Database Lokal',
    endpoint: 'Internal Quote Database',
    shortDesc: 'Menyajikan kutipan motivasi dan kata bijak dari database.',
    fullDesc:
      'Fitur penyemangat harian yang menyajikan kutipan motivasi dan kata mutiara yang tersimpan di dalam database bot secara acak dan instan.',
    exampleInput: '!quote',
    exampleOutput:
      '✨ *KATA BIJAK HARI INI:*\n\n"Kesuksesan berawal dari langkah kecil yang konsisten setiap hari."\n— Eka Syarif',
    parameters: ['Tanpa parameter'],
    latency: '< 15 ms',
    autoTyping: false,
    icon: Quote,
    isConfigurable: true,
  },
  {
    id: 'supermemory',
    name: 'Supermemory Engine',
    command: 'Otomatis via AI',
    alias: 'Persistent Memory Hub',
    category: 'AI & Memori',
    provider: 'Supermemory API (Gratis)',
    apiStatus: 'Terhubung • Free Tier',
    endpoint: 'https://api.supermemory.ai/v4/search',
    model: 'Vector Memory & Graph Context',
    shortDesc: 'Memori jangka panjang untuk mengingat preferensi dan fakta pengguna.',
    fullDesc:
      'Layanan memori persisten modern berbasis Supermemory API. Setiap percakapan pengguna diisolasi rapi menggunakan containerTag per-user untuk menjaga kesinambungan ingatan AI.',
    exampleInput: '!ai kemarin aku cerita kerja di mana ya?',
    exampleOutput:
      'Kemarin kamu cerita kerja di bidang jaringan IT! Masih ada yang mau dibahas?',
    parameters: ['containerTag: user_<sender_jid>'],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: Brain,
    isConfigurable: true,
  },
  {
    id: 'calc',
    name: 'Kalkulator',
    command: '!calc <ekspresi>',
    alias: '/calc <hitungan>',
    category: 'Produktivitas',
    provider: 'Math Engine',
    apiStatus: 'Online • Bebas Kuota',
    endpoint: 'Internal Math Evaluator',
    shortDesc: 'Menghitung rumus matematika secara cepat dan tepat.',
    fullDesc:
      'Layanan kalkulasi pintar yang mampu mengevaluasi perhitungan matematika, persentase, konversi unit, dan operasi logika dengan hasil yang ringkas.',
    exampleInput: '!calc (150000 * 0.12) + 25000',
    exampleOutput: '🔢 *Hasil Hitung ((150000 * 0.12) + 25000):*\n43.000',
    parameters: ['<ekspresi> (Ekspresi aritmatika seperti tambah, kurang, persen)'],
    latency: '< 20 ms',
    autoTyping: false,
    icon: Calculator,
    isConfigurable: true,
  },
  {
    id: 'ping',
    name: 'Latensi (Ping)',
    command: '!ping',
    alias: '/ping',
    category: 'Sistem',
    provider: 'WhatsMeow Engine',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Local WebSocket Handler',
    shortDesc: 'Mengukur kecepatan respon pemrosesan pesan bot secara real-time.',
    fullDesc:
      'Perintah diagnostik untuk mengukur latensi round-trip antara penerimaan pesan masuk hingga respon keluar terkirim.',
    exampleInput: '!ping',
    exampleOutput: 'Pong! 🏓 Kecepatan respon: 18 ms',
    parameters: ['Tanpa parameter'],
    latency: '< 25 ms',
    autoTyping: false,
    icon: Zap,
    isConfigurable: true,
  },
  {
    id: 'antilink',
    name: 'Moderasi Anti-Link',
    command: 'Otomatis di Grup',
    alias: 'Group Shield',
    category: 'Grup',
    provider: 'WhatsMeow Group Admin',
    apiStatus: 'Aktif • Realtime',
    endpoint: 'Internal Group Moderation',
    shortDesc: 'Menghapus tautan mencurigakan otomatis saat bot menjadi admin grup.',
    fullDesc:
      'Sistem keamanan grup otomatis yang memindai tautan WhatsApp, wa.me, dan URL ilegal. Pesan dari non-admin akan ditarik seketika.',
    exampleInput: 'Anggota mengirimkan link grup lain',
    exampleOutput: 'Pesan ditarik otomatis (revoke) oleh bot.',
    parameters: ['Izin Admin grup'],
    latency: '< 30 ms',
    autoTyping: false,
    icon: Shield,
    isConfigurable: true,
  },
  {
    id: 'welcome-farewell',
    name: 'Sambutan & Pamitan',
    command: 'Otomatis di Grup',
    alias: 'Welcome & Farewell',
    category: 'Grup',
    provider: 'WhatsMeow Event Listener',
    apiStatus: 'Aktif • Realtime',
    endpoint: 'Group Participant Event',
    shortDesc: 'Menyapa anggota baru atau pamitan saat anggota keluar dari grup.',
    fullDesc:
      'Pesan sambutan dan perpisahan otomatis dengan kustomisasi template dinamis ({name} untuk nama dan {group} untuk nama grup).',
    exampleInput: 'Peserta bergabung ke dalam grup',
    exampleOutput:
      'Selamat datang {name} di grup {group}! Silakan baca peraturan grup ya.',
    parameters: ['Variabel: {name}, {group}'],
    latency: '< 40 ms',
    autoTyping: false,
    icon: MessageSquare,
    isConfigurable: true,
  },
  {
    id: 'scheduler',
    name: 'Pesan Terjadwal',
    command: 'Form Terjadwal',
    alias: 'Smart 24h Scheduler',
    category: 'Produktivitas',
    provider: 'SQLite Worker (WIB)',
    apiStatus: 'Aktif • Background',
    endpoint: 'Internal Scheduler Cron & Worker',
    shortDesc: 'Mengirim pesan terjadwal otomatis dengan zona waktu 24 jam WIB.',
    fullDesc:
      'Sistem penjadwalan pesan berbasis waktu 24 jam dan zona waktu permanen Asia/Jakarta (WIB) dengan pengulangan fleksibel.',
    exampleInput: 'Jadwalkan pesan jam 14:30',
    exampleOutput: 'Pesan terkirim tepat waktu ke penerima yang ditentukan.',
    parameters: ['Format waktu 24 Jam (00-23 : 00-59)'],
    latency: 'Tepat Waktu',
    autoTyping: false,
    icon: CalendarClock,
    isConfigurable: true,
  },
]

export default function BotMenuPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<BotCategory>('all')
  const [search, setSearch] = useState('')
  const [selectedFeature, setSelectedFeature] = useState<BotFeature | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [featureConfigs, setFeatureConfigs] = useState<{
    weather: { apiKey: string; defaultCity: string; provider: string; isActive: boolean }
    news: { apiKey: string; category: string; provider: string; isActive: boolean }
    quote: { isActive: boolean }
    calc: { isActive: boolean }
    ping: { isActive: boolean }
  }>(() => {
    try {
      const saved = localStorage.getItem('bot_feature_settings_v1')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      weather: { apiKey: '', defaultCity: 'Jakarta', provider: 'openweathermap', isActive: true },
      news: { apiKey: '', category: 'nasional', provider: 'newsapi', isActive: true },
      quote: { isActive: true },
      calc: { isActive: true },
      ping: { isActive: true },
    }
  })

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

  const saveFeatureConfigs = (updated: typeof featureConfigs) => {
    setFeatureConfigs(updated)
    try {
      localStorage.setItem('bot_feature_settings_v1', JSON.stringify(updated))
    } catch {
      // ignore
    }
    toast.success('Pengaturan disimpan')
  }

  const saveQuotesList = (updated: QuoteItem[]) => {
    setQuotes(updated)
    try {
      localStorage.setItem('bot_quotes_db_v1', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  const handleAddQuote = () => {
    if (!newQuoteText.trim()) {
      toast.error('Kutipan wajib diisi')
      return
    }
    const item: QuoteItem = {
      id: Date.now().toString(),
      quote: newQuoteText.trim(),
      author: newQuoteAuthor.trim() || 'Anonim',
    }
    const updated = [item, ...quotes]
    saveQuotesList(updated)
    setNewQuoteText('')
    setNewQuoteAuthor('')
    toast.success('Kata mutiara ditambahkan')
  }

  const handleDeleteQuote = (id: string) => {
    const updated = quotes.filter((q) => q.id !== id)
    saveQuotesList(updated)
    toast.success('Kata mutiara dihapus')
  }

  const handleResetQuotes = () => {
    saveQuotesList(DEFAULT_QUOTES)
    toast.success('Kata mutiara direset ke default')
  }

  const copyText = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Disalin: ${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredFeatures = useMemo(() => {
    return BOT_FEATURES.filter((item) => {
      const matchCategory = filter === 'all' || item.category === filter
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.command.toLowerCase().includes(search.toLowerCase()) ||
        item.provider.toLowerCase().includes(search.toLowerCase()) ||
        item.shortDesc.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [filter, search])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menu Bot"
        description="Katalog perintah dan konfigurasi fitur bot WhatsApp."
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-lg border">
          {(
            [
              'all',
              'AI & Memori',
              'Produktivitas',
              'Grup',
              'Sistem',
            ] as BotCategory[]
          ).map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(cat)}
              className="h-7 text-xs px-2.5 rounded-md"
            >
              {cat === 'all' ? 'Semua' : cat}
            </Button>
          ))}
        </div>
      </div>

      {filteredFeatures.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-muted/20">
          <Bot className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm font-semibold">Tidak ada fitur</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ubah kata kunci pencarian atau kategori filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((item) => {
            const Icon = item.icon
            const isCopied = copiedId === item.id

            return (
              <Card
                key={item.id}
                className="glass-card flex flex-col justify-between border-border/70 backdrop-blur-xl hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {item.name}
                        </CardTitle>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                    >
                      {item.provider.includes('Gratis') ? 'Gratis' : 'Aktif'}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-md bg-muted/60 px-2 py-1 border border-border/50">
                    <code className="text-xs font-mono font-semibold text-primary truncate">
                      {item.command}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyText(item.command, item.id)}
                      title="Salin"
                    >
                      {isCopied ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 pb-3 flex-1">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.shortDesc}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Provider
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.provider}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Respon
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.latency}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t flex items-center justify-between gap-2 bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-md flex-1"
                    onClick={() => copyText(item.command, item.id)}
                  >
                    {isCopied ? 'Tersalin' : 'Salin'}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-md flex-1"
                    onClick={() => setSelectedFeature(item)}
                  >
                    Detail
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={Boolean(selectedFeature)}
        onOpenChange={(open) => {
          if (!open) setSelectedFeature(null)
        }}
      >
        {selectedFeature && (
          <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <selectedFeature.icon className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">
                    {selectedFeature.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedFeature.category} • {selectedFeature.provider}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="p-5 flex-1 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-4 text-xs">
                {selectedFeature.id === 'weather' && (
                  <Card className="border border-border/70 bg-muted/20">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <Sliders className="size-3.5 text-primary" />
                        <span>Konfigurasi Cuaca</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <Label className="text-xs font-medium block">Status</Label>
                          <span className="text-[10px] text-muted-foreground block">
                            Aktifkan fitur cuaca
                          </span>
                        </div>
                        <Switch
                          checked={featureConfigs.weather.isActive}
                          onCheckedChange={(val) =>
                            saveFeatureConfigs({
                              ...featureConfigs,
                              weather: { ...featureConfigs.weather, isActive: val },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">API Key</Label>
                        <Input
                          placeholder="Kunci"
                          value={featureConfigs.weather.apiKey}
                          onChange={(e) =>
                            setFeatureConfigs({
                              ...featureConfigs,
                              weather: { ...featureConfigs.weather, apiKey: e.target.value },
                            })
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Kota Default</Label>
                          <Input
                            placeholder="Kota"
                            value={featureConfigs.weather.defaultCity}
                            onChange={(e) =>
                              setFeatureConfigs({
                                ...featureConfigs,
                                weather: { ...featureConfigs.weather, defaultCity: e.target.value },
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Provider</Label>
                          <Select
                            value={featureConfigs.weather.provider}
                            onValueChange={(val) =>
                              setFeatureConfigs({
                                ...featureConfigs,
                                weather: { ...featureConfigs.weather, provider: val },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openweathermap">OpenWeather</SelectItem>
                              <SelectItem value="weatherapi">WeatherAPI</SelectItem>
                              <SelectItem value="bmkg">BMKG (Publik)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          onClick={() => saveFeatureConfigs(featureConfigs)}
                          className="h-7 text-xs px-3"
                        >
                          Simpan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedFeature.id === 'news' && (
                  <Card className="border border-border/70 bg-muted/20">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <Sliders className="size-3.5 text-primary" />
                        <span>Konfigurasi Berita</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <Label className="text-xs font-medium block">Status</Label>
                          <span className="text-[10px] text-muted-foreground block">
                            Aktifkan fitur berita
                          </span>
                        </div>
                        <Switch
                          checked={featureConfigs.news.isActive}
                          onCheckedChange={(val) =>
                            saveFeatureConfigs({
                              ...featureConfigs,
                              news: { ...featureConfigs.news, isActive: val },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">API Key</Label>
                        <Input
                          placeholder="Kunci"
                          value={featureConfigs.news.apiKey}
                          onChange={(e) =>
                            setFeatureConfigs({
                              ...featureConfigs,
                              news: { ...featureConfigs.news, apiKey: e.target.value },
                            })
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Kategori</Label>
                          <Select
                            value={featureConfigs.news.category}
                            onValueChange={(val) =>
                              setFeatureConfigs({
                                ...featureConfigs,
                                news: { ...featureConfigs.news, category: val },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
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
                          <Label className="text-xs font-medium">Provider</Label>
                          <Select
                            value={featureConfigs.news.provider}
                            onValueChange={(val) =>
                              setFeatureConfigs({
                                ...featureConfigs,
                                news: { ...featureConfigs.news, provider: val },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newsapi">NewsAPI</SelectItem>
                              <SelectItem value="gnews">GNews</SelectItem>
                              <SelectItem value="antara">Antara RSS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          onClick={() => saveFeatureConfigs(featureConfigs)}
                          className="h-7 text-xs px-3"
                        >
                          Simpan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedFeature.id === 'quote' && (
                  <Card className="border border-border/70 bg-muted/20">
                    <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <Quote className="size-3.5 text-primary" />
                        <span>Database Kata Mutiara</span>
                        <Badge variant="outline" className="text-[10px] font-mono ml-1">
                          {quotes.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetQuotes}
                        className="h-6 text-[10px] px-1.5 text-muted-foreground gap-1"
                        title="Reset Default"
                      >
                        <RefreshCw className="size-2.5" />
                        <span>Reset</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <div>
                          <Label className="text-xs font-medium block">Status</Label>
                          <span className="text-[10px] text-muted-foreground block">
                            Aktifkan respon !quote
                          </span>
                        </div>
                        <Switch
                          checked={featureConfigs.quote.isActive}
                          onCheckedChange={(val) =>
                            saveFeatureConfigs({
                              ...featureConfigs,
                              quote: { ...featureConfigs.quote, isActive: val },
                            })
                          }
                        />
                      </div>

                      <div className="rounded-lg border bg-background/50 p-2.5 space-y-2">
                        <Label className="text-xs font-semibold block">Tambah Baru</Label>
                        <Input
                          placeholder="Kutipan"
                          value={newQuoteText}
                          onChange={(e) => setNewQuoteText(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Penulis"
                            value={newQuoteAuthor}
                            onChange={(e) => setNewQuoteAuthor(e.target.value)}
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddQuote}
                            className="h-8 text-xs px-3 gap-1"
                          >
                            <Plus className="size-3.5" />
                            <span>Tambah</span>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {quotes.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-start justify-between gap-2 p-2 rounded-md border bg-card/60 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground leading-snug line-clamp-2">
                                "{q.quote}"
                              </p>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                — {q.author}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDeleteQuote(q.id)}
                              className="size-6 text-muted-foreground hover:text-rose-500 shrink-0"
                              title="Hapus"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedFeature.id === 'ai-chat' && (
                  <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Pengaturan AI</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Kelola model, prompt umum, dan persona nomor khusus.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFeature(null)
                        navigate('/bot/ai')
                      }}
                      className="h-7 text-xs px-3 gap-1"
                    >
                      <span>Buka AI</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                )}

                {selectedFeature.id === 'antilink' && (
                  <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Pengaturan Grup</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Kelola moderasi anti-link dan sambutan per grup.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFeature(null)
                        navigate('/bot/groups')
                      }}
                      className="h-7 text-xs px-3 gap-1"
                    >
                      <span>Buka Grup</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                )}

                {selectedFeature.id === 'scheduler' && (
                  <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Jadwal Pesan</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Kelola pengiriman pesan otomatis 24 jam.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFeature(null)
                        navigate('/scheduled')
                      }}
                      className="h-7 text-xs px-3 gap-1"
                    >
                      <span>Buka Jadwal</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-xs">
                    Cara Kerja
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedFeature.fullDesc}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                  <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    Spesifikasi Teknis
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Status
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {selectedFeature.apiStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Respon
                      </span>
                      <span className="font-medium">{selectedFeature.latency}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">
                        Endpoint
                      </span>
                      <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[10px] break-all block">
                        {selectedFeature.endpoint}
                      </code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-xs">
                    Parameter
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {selectedFeature.parameters.map((param, index) => (
                      <li key={index} className="text-[11px]">
                        {param}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-1.5 text-xs flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    Simulasi WhatsApp
                  </h4>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
                    <div className="flex flex-col items-end">
                      <div className="bg-primary text-primary-foreground text-xs rounded-lg rounded-tr-none px-3 py-1.5 max-w-[85%] font-mono">
                        {selectedFeature.exampleInput}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        Pengguna
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="bg-muted text-foreground text-xs rounded-lg rounded-tl-none px-3 py-1.5 max-w-[85%] whitespace-pre-line">
                        {selectedFeature.exampleOutput}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        Bot WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 rounded-md"
                onClick={() => setSelectedFeature(null)}
              >
                Tutup
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs px-3 rounded-md"
                onClick={() => {
                  copyText(selectedFeature.command, selectedFeature.id)
                }}
              >
                Salin Perintah
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
