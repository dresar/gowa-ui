import { useMemo, useState } from 'react'
import {
  Activity,
  Bot,
  Brain,
  Calculator,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Cpu,
  Info,
  Layers,
  MessageSquare,
  Quote,
  Search,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area'

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
}

const BOT_FEATURES: BotFeature[] = [
  {
    id: 'ai-chat',
    name: 'Asisten AI Pintar',
    command: '!ai <pesan>',
    alias: '/ai, percakapan langsung',
    category: 'AI & Memori',
    provider: 'Bynara API (Gratis)',
    apiStatus: 'Online • Bebas Kuota',
    endpoint: 'https://router.bynara.id/v1/chat/completions',
    model: 'step-5-preview',
    shortDesc: 'Asisten percakapan cerdas berbahasa santai dengan memori 100 chat.',
    fullDesc:
      'Engine AI pintar berbasis model step-5-preview dengan kepribadian ramah, santai, dan non-formal ala manusia Indonesia. Mampu mengenali identitas pushname/username WhatsApp pengguna secara langsung serta meninjau hingga 100 riwayat chat sebelumnya untuk menjaga konteks percakapan yang akurat.',
    exampleInput: '!ai halo kamu kenal aku gak?',
    exampleOutput:
      'Halo! Iya kenal dong, kamu dengan username WhatsApp {nama}. Ada yang bisa kubantu hari ini?',
    parameters: [
      '<pesan> (Teks pertanyaan atau perintah)',
      '100 pesan riwayat chat terakhir (otomatis dikirim sebagai konteks)',
      'Username / PushName WhatsApp pengirim (otomatis dideteksi)',
    ],
    latency: '400 - 900 ms',
    autoTyping: true,
    icon: Sparkles,
  },
  {
    id: 'supermemory',
    name: 'Supermemory Engine',
    command: 'Otomatis via AI',
    alias: 'Persistent Memory Hub',
    category: 'AI & Memori',
    provider: 'Supermemory API (Gratis)',
    apiStatus: 'Terhubung • Free Tier',
    endpoint: 'https://api.supermemory.ai/v4/search & /v3/documents',
    model: 'Vector Memory & Graph Context',
    shortDesc: 'Memori jangka panjang untuk mengingat preferensi dan fakta unik pengguna.',
    fullDesc:
      'Layanan memori persisten modern berbasis Supermemory API. Setiap percakapan pengguna diisolasi rapi menggunakan containerTag per-user. Supermemory secara otomatis mengekstrak fakta penting, preferensi pribadi, dan riwayat obrolan terdahulu agar AI tidak pernah lupa.',
    exampleInput: '!ai kemarin aku cerita kerja di mana ya?',
    exampleOutput:
      'Kemarin kamu bilang kerja di bidang jaringan IT! Masih ada yang mau dibahas seputar kerjaanmu?',
    parameters: [
      'containerTag: user_<sender_jid>',
      'taskType: memory (ekstraksi fakta & relasi graph)',
      'searchMode: hybrid (memori + dokumen konteks)',
    ],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: Brain,
  },
  {
    id: 'ping',
    name: 'Cek Latensi (Ping)',
    command: '!ping',
    alias: '/ping',
    category: 'Sistem',
    provider: 'WhatsMeow Engine',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Local WebSocket Handler',
    shortDesc: 'Mengukur kecepatan respon pemrosesan pesan bot secara real-time.',
    fullDesc:
      'Perintah diagnostik untuk mengukur latensi round-trip antara penerimaan pesan masuk hingga respon keluar terkirim. Membantu memantau kesehatan server dan koneksi WhatsApp.',
    exampleInput: '!ping',
    exampleOutput: 'Pong! 🏓 Kecepatan respon: 18 ms',
    parameters: ['Tanpa parameter tambahan'],
    latency: '< 25 ms',
    autoTyping: false,
    icon: Zap,
  },
  {
    id: 'quote',
    name: 'Kata Bijak & Motivasi',
    command: '!quote',
    alias: '/quote',
    category: 'Produktivitas',
    provider: 'Generator Kata Bijak',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'Internal Quote Engine',
    shortDesc: 'Menyajikan kutipan inspiratif dan kata mutiara pilihan secara instan.',
    fullDesc:
      'Fitur penambah semangat yang menghasilkan kutipan motivasi, produktivitas, dan kata bijak harian yang dipilih secara acak untuk memotivasi pengguna di obrolan pribadi maupun grup.',
    exampleInput: '!quote',
    exampleOutput:
      '✨ *KATA BIJAK HARI INI:*\n\n"Kesuksesan berawal dari langkah kecil yang konsisten setiap hari."',
    parameters: ['Tanpa parameter'],
    latency: '< 15 ms',
    autoTyping: false,
    icon: Quote,
  },
  {
    id: 'calc',
    name: 'Kalkulator Matematika',
    command: '!calc <ekspresi>',
    alias: '/calc <hitungan>',
    category: 'Produktivitas',
    provider: 'Bynara AI Math Engine',
    apiStatus: 'Online • Bebas Kuota',
    endpoint: 'https://router.bynara.id/v1/chat/completions',
    model: 'step-5-preview',
    shortDesc: 'Menghitung rumus atau perhitungan matematika secara cepat dan tepat.',
    fullDesc:
      'Layanan kalkulasi pintar yang mampu mengevaluasi perhitungan matematika, persentase, konversi unit, dan operasi logika dengan hasil yang ringkas dan langsung to-the-point.',
    exampleInput: '!calc (150000 * 0.12) + 25000',
    exampleOutput: '🔢 *Hasil Hitung ((150000 * 0.12) + 25000):*\n43.000',
    parameters: [
      '<ekspresi> (Ekspresi aritmatika seperti tambah, kurang, persen, dsb.)',
    ],
    latency: '300 - 600 ms',
    autoTyping: true,
    icon: Calculator,
  },
  {
    id: 'menu',
    name: 'Daftar Menu Bot',
    command: '!menu',
    alias: '/menu, !help',
    category: 'Sistem',
    provider: 'WhatsMeow Bot Handler',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Local Message Dispatcher',
    shortDesc: 'Menampilkan katalog menu dan panduan perintah yang tersedia di WhatsApp.',
    fullDesc:
      'Panduan interaktif lengkap yang bisa dipanggil pengguna kapan saja untuk melihat semua perintah aktif yang dapat dijalankan pada bot WhatsApp.',
    exampleInput: '!menu',
    exampleOutput:
      '*🤖 DAFTAR MENU BOT WHATSAPP*\n\n• *!menu* - Tampilkan daftar perintah bot ini\n• *!ping* - Tes kecepatan respon bot (latensi ms)\n• *!ai <pesan>* - Mengobrol santai dengan asisten AI pintar\n• *!quote* - Kutipan motivasi & kata bijak harian\n• *!calc <ekspresi>* - Hitung kalkulasi matematika instan\n• *!info* - Info bot WhatsApp',
    parameters: ['Tanpa parameter'],
    latency: '< 20 ms',
    autoTyping: false,
    icon: Terminal,
  },
  {
    id: 'info',
    name: 'Informasi Status Bot',
    command: '!info',
    alias: '/info',
    category: 'Sistem',
    provider: 'WhatsMeow & Bot Service',
    apiStatus: 'Aktif • Internal',
    endpoint: 'System State Provider',
    shortDesc: 'Menampilkan status operasional, model AI, dan engine memori.',
    fullDesc:
      'Menyajikan rangkuman status terkini mengenai bot WhatsApp, mencakup ketersediaan layanan, engine AI Step-5-Preview, integrasi Supermemory, dan versi sistem.',
    exampleInput: '!info',
    exampleOutput:
      '*ℹ️ INFORMASI BOT WHATSAPP*\n\nStatus: Online & Siap Melayani\nModel AI: Step-5-Preview (Bynara)\nFitur: Smart Context Memory (100 Pesan) + Supermemory',
    parameters: ['Tanpa parameter'],
    latency: '< 15 ms',
    autoTyping: false,
    icon: Info,
  },
  {
    id: 'antilink',
    name: 'Moderasi Anti-Link Grup',
    command: 'Otomatis di Grup',
    alias: 'Group Shield',
    category: 'Grup',
    provider: 'WhatsMeow Group Admin',
    apiStatus: 'Aktif • Realtime',
    endpoint: 'Internal Group Moderation',
    shortDesc: 'Menghapus pesan tautan mencurigakan otomatis saat bot menjadi admin grup.',
    fullDesc:
      'Sistem keamanan grup otomatis yang memindai tautan WhatsApp, wa.me, dan URL web ilegal. Jika anggota non-admin mengirimkan tautan, pesan akan langsung ditarik (revoke) secara seketika.',
    exampleInput: 'Anggota mengirimkan link undangan grup lain',
    exampleOutput: 'Pesan ditarik otomatis (revoke) oleh bot.',
    parameters: [
      'Membutuhkan izin Admin pada bot di dalam grup',
      'Pola link: chat.whatsapp.com, wa.me, http/https',
    ],
    latency: '< 30 ms',
    autoTyping: false,
    icon: Shield,
  },
  {
    id: 'welcome-farewell',
    name: 'Sambutan & Perpisahan',
    command: 'Otomatis di Grup',
    alias: 'Welcome & Farewell',
    category: 'Grup',
    provider: 'WhatsMeow Event Listener',
    apiStatus: 'Aktif • Realtime',
    endpoint: 'Group Participant Join/Leave Event',
    shortDesc: 'Menyapa anggota baru atau pamitan saat anggota keluar dari grup.',
    fullDesc:
      'Pesan sambutan dan perpisahan otomatis dengan kustomisasi template dinamis. Mendukung tag variabel {name} untuk nama peserta dan {group} untuk nama grup.',
    exampleInput: 'Peserta baru bergabung ke dalam grup',
    exampleOutput:
      'Selamat datang {name} di grup {group}! Silakan baca peraturan grup ya.',
    parameters: [
      'Variabel: {name} (nama pengguna)',
      'Variabel: {group} (nama grup WhatsApp)',
    ],
    latency: '< 40 ms',
    autoTyping: false,
    icon: MessageSquare,
  },
  {
    id: 'scheduler',
    name: 'Pesan Terjadwal 24 Jam',
    command: 'Form Terjadwal',
    alias: 'Smart 24h Scheduler',
    category: 'Produktivitas',
    provider: 'SQLite Worker (WIB)',
    apiStatus: 'Aktif • Background',
    endpoint: 'Internal Scheduler Cron & Worker',
    shortDesc: 'Mengirim pesan terjadwal otomatis dengan zona waktu 24 jam Indonesia (WIB).',
    fullDesc:
      'Sistem penjadwalan pesan berbasis waktu 24 jam (00-23) dan zona waktu permanen Asia/Jakarta (WIB). Mendukung timer cepat kustom serta pengulangan per jam, per 2 jam, harian, mingguan, dan bulanan.',
    exampleInput: 'Jadwalkan pesan jam 14:30 atau +45 Menit',
    exampleOutput: 'Pesan terkirim tepat waktu ke penerima yang ditentukan.',
    parameters: [
      'Waktu kirim format 24 Jam (00-23 : 00-59)',
      'Pengulangan: Sekali, Setiap Jam, Setiap 2 Jam, Harian, Mingguan, Bulanan',
      'Timer cepat kustom (menit / jam)',
    ],
    latency: 'Tepat Waktu',
    autoTyping: false,
    icon: CalendarClock,
  },
]

export default function BotMenuPage() {
  const [filter, setFilter] = useState<BotCategory>('all')
  const [search, setSearch] = useState('')
  const [selectedFeature, setSelectedFeature] = useState<BotFeature | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
        description="Manajemen fitur dan perintah interaktif WhatsApp."
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-border/70 backdrop-blur-xl">
          <CardHeader className="p-3.5 pb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-red-500/10 text-red-500">
                <Layers className="size-4" />
              </div>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Fitur
              </CardTitle>
            </div>
            <CardDescription className="text-xl font-bold text-foreground mt-1">
              {BOT_FEATURES.length} Fitur
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-1 text-[11px] text-muted-foreground">
            Semua siap digunakan.
          </CardContent>
        </Card>

        <Card className="glass-card border-border/70 backdrop-blur-xl">
          <CardHeader className="p-3.5 pb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                <Sparkles className="size-4" />
              </div>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Model AI
              </CardTitle>
            </div>
            <CardDescription className="text-xl font-bold text-foreground mt-1">
              Step-5-Preview
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Bynara API (Gratis)
          </CardContent>
        </Card>

        <Card className="glass-card border-border/70 backdrop-blur-xl">
          <CardHeader className="p-3.5 pb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                <Brain className="size-4" />
              </div>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Memori
              </CardTitle>
            </div>
            <CardDescription className="text-xl font-bold text-foreground mt-1">
              Supermemory
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            100 Riwayat Konteks
          </CardContent>
        </Card>

        <Card className="glass-card border-border/70 backdrop-blur-xl">
          <CardHeader className="p-3.5 pb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                <Cpu className="size-4" />
              </div>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                WhatsApp Core
              </CardTitle>
            </div>
            <CardDescription className="text-xl font-bold text-foreground mt-1">
              WhatsMeow
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Auto-Typing Aktif
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
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

      {/* Grid Cards Layout */}
      {filteredFeatures.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-muted/20">
          <Bot className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm font-semibold">Tidak ada fitur ditemukan</p>
          <p className="text-xs text-muted-foreground mt-1">
            Coba ubah kata kunci pencarian atau kategori filter.
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
                      {item.provider.includes('Gratis') ? 'Gratis ⚡' : 'Aktif'}
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

      {/* Feature Detail Modal Dialog */}
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
                {/* Deskripsi */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1 text-xs">
                    Cara Kerja
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedFeature.fullDesc}
                  </p>
                </div>

                {/* Spesifikasi Teknis */}
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                  <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    Spesifikasi API & Sistem
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        API Status
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {selectedFeature.apiStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Estimasi Respon
                      </span>
                      <span className="font-medium">{selectedFeature.latency}</span>
                    </div>
                    {selectedFeature.model && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block text-[10px]">
                          Model
                        </span>
                        <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px]">
                          {selectedFeature.model}
                        </code>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">
                        Endpoint / Engine
                      </span>
                      <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[10px] break-all block">
                        {selectedFeature.endpoint}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Parameter */}
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

                {/* Simulasi Interaksi */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1.5 text-xs flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    Simulasi Chat WhatsApp
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
