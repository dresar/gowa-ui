import {
  Brain,
  Calculator,
  CalendarClock,
  CloudSun,
  MessageSquare,
  Newspaper,
  Quote,
  Shield,
  Sparkles,
  UserRoundSearch,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

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
  instruction: string
  exampleInput: string
  exampleOutput: string
  parameters: string[]
  latency: string
  autoTyping: boolean
  icon: ComponentType<{ className?: string }>
  isConfigurable: boolean
}

export interface QuoteItem {
  id: string
  quote: string
  author: string
}

export interface StoredFeatureConfig {
  command?: string
  alias?: string
  isActive?: boolean
  instruction?: string
  exampleInput?: string
  exampleOutput?: string
  autoTyping?: boolean
  custom?: Record<string, any>
}

export const DEFAULT_QUOTES: QuoteItem[] = [
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

export const BOT_FEATURES: BotFeature[] = [
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
    instruction:
      'Balas obrolan dengan gaya bahasa santai, hangat, manusiawi, dan tidak kaku. Serap konteks pesan sebelumnya dan nama pengirim. Hindari kalimat formal khas robot atau customer service.',
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
    provider: 'BMKG Indonesia (Resmi)',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
    shortDesc: 'Prakiraan cuaca, suhu, kelembaban, dan angin resmi BMKG.',
    fullDesc:
      'Layanan data terbuka resmi BMKG (Badan Meteorologi, Klimatologi, dan Geofisika). Menyajikan prakiraan cuaca 3 harian, suhu (°C), kelembapan (%), kecepatan angin, dan tutupan awan tanpa API key.',
    instruction:
      'Ambil data prakiraan cuaca BMKG via nama kota atau kode adm4. Sajikan suhu (°C), kelembaban (%), kondisi cuaca, kecepatan/arah angin, serta waktu berikutnya dengan atribusi BMKG.',
    exampleInput: '!cuaca Jakarta',
    exampleOutput:
      '🌤️ *PRAKIRAAN CUACA BMKG*\n📍 *Lokasi:* Kota Administrasi Jakarta Pusat\n⏱️ *Waktu:* 2026-10-07 10:00:00\n\n🌡️ *Suhu:* 31°C\n💧 *Kelembapan:* 70%\n☁️ *Kondisi:* Cerah Berawan\n💨 *Angin:* 10 km/jam (SE)\n☁️ *Tutupan Awan:* 40%\n\n_Sumber: BMKG_',
    parameters: ['<kota> (Nama kota/kabupaten atau kode adm4)'],
    latency: '150 - 300 ms',
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
    shortDesc: 'Headline berita terhangat nasional, teknologi, dan bisnis.',
    fullDesc:
      'Mengambil intisari berita teraktual dari berbagai portal berita terpercaya secara berkala berdasarkan topik yang diminta pengguna.',
    instruction:
      'Ambil 3 hingga 5 ringkasan berita terkini sesuai topik yang diminta. Berikan judul berita singkat, poin ringkasan 1 kalimat, dan sumber terpercaya.',
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
    id: 'directory',
    name: 'Pencarian Direktori',
    command: '!cek <nomor>',
    alias: '!info, !avatar, !bisnis',
    category: 'Produktivitas',
    provider: 'WhatsApp Core API',
    apiStatus: 'Aktif • Multi-Akun',
    endpoint: 'Account Query & Contact Lookup',
    shortDesc: 'Cek status nomor, info akun, foto profil, dan profil bisnis.',
    fullDesc:
      'Fitur lookup WhatsApp terintegrasi yang memungkinkan pengecekan nomor aktif, informasi akun pengguna, foto profil (avatar), serta profil bisnis secara instan melalui chat bot.',
    instruction:
      'Lakukan lookup pada nomor tujuan. Tampilkan status pendaftaran di WhatsApp, JID resmi, nama tampilan publik jika tersedia, foto profil, dan informasi bisnis jika terdaftar sebagai WhatsApp Business.',
    exampleInput: '!cek 6285216149732',
    exampleOutput:
      '✅ *NOMOR TERDAFTAR*\nNomor: +62 852-1614-9732\nJID: 6285216149732@s.whatsapp.net\nStatus: Aktif di WhatsApp',
    parameters: ['<nomor> (Nomor WhatsApp atau JID)'],
    latency: '100 - 300 ms',
    autoTyping: false,
    icon: UserRoundSearch,
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
    shortDesc: 'Kutipan motivasi dan kata bijak dari database.',
    fullDesc:
      'Fitur penyemangat harian yang menyajikan kutipan motivasi dan kata mutiara yang tersimpan di dalam database bot secara acak dan instan.',
    instruction:
      'Pilih satu kata mutiara secara acak dari database quote. Format dengan rapi menggunakan tanda petik dan sertakan nama pembuat kutipan di baris baru.',
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
    instruction:
      'Simpan fakta penting, preferensi, riwayat topik pembicaraan pengguna ke Supermemory secara asinkron. Panggil memori saat pengguna menanyakan hal masa lalu.',
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
    instruction:
      'Hitung ekspresi matematika dengan teliti dan benar. Tampilkan hasil perhitungan akhir secara to the point tanpa penjelasan bertele-tele kecuali diminta.',
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
    instruction:
      'Balas seketika dengan kata Pong dan sertakan durasi latensi dalam milidetik (ms).',
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
    instruction:
      'Periksa apakah pesan masuk di grup mengandung tautan website atau undangan WhatsApp. Jika pengirim bukan admin, tarik pesan seketika dan berikan peringatan singkat.',
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
    instruction:
      'Kirim pesan sambutan ramah saat anggota baru bergabung ke grup. Kirim ucapan pamit saat anggota keluar.',
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
    instruction:
      'Pantau antrian pesan terjadwal di SQLite. Eksekusi pengiriman tepat pada waktu yang ditentukan dengan zona Asia/Jakarta (WIB).',
    exampleInput: 'Jadwalkan pesan jam 14:30',
    exampleOutput: 'Pesan terkirim tepat waktu ke penerima yang ditentukan.',
    parameters: ['Format waktu 24 Jam (00-23 : 00-59)'],
    latency: 'Tepat Waktu',
    autoTyping: false,
    icon: CalendarClock,
    isConfigurable: true,
  },
]

export function getStoredFeatureConfig(featureId: string, deviceId?: string | null): StoredFeatureConfig {
  const globalKey = `bot_feature_cfg_${featureId}`
  const deviceKey = deviceId ? `bot_feature_cfg_${featureId}_${deviceId}` : null

  try {
    if (deviceKey) {
      const devVal = localStorage.getItem(deviceKey)
      if (devVal) return JSON.parse(devVal)
    }
    const globVal = localStorage.getItem(globalKey)
    if (globVal) return JSON.parse(globVal)
  } catch {
    // fallback
  }

  const feat = BOT_FEATURES.find((f) => f.id === featureId)
  return {
    command: feat?.command,
    alias: feat?.alias,
    isActive: true,
    instruction: feat?.instruction,
    exampleInput: feat?.exampleInput,
    exampleOutput: feat?.exampleOutput,
    autoTyping: feat?.autoTyping ?? false,
    custom: {},
  }
}

export function saveStoredFeatureConfig(
  featureId: string,
  config: StoredFeatureConfig,
  deviceId?: string | null,
  applyToAll: boolean = true,
): void {
  try {
    const raw = JSON.stringify(config)
    localStorage.setItem(`bot_feature_cfg_${featureId}`, raw)
    if (!applyToAll && deviceId) {
      localStorage.setItem(`bot_feature_cfg_${featureId}_${deviceId}`, raw)
    }
  } catch {
    // ignore
  }
}
