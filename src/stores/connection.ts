import axios from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ResponseData } from '@/api/types'
import { basicAuthHeader } from '@/lib/api-error'
import { normalizeBaseUrl, sameOriginBaseUrl } from '@/lib/url'

export type ConnectionStatus =
  | 'booting'
  | 'unconfigured'
  | 'connected'
  | 'unauthorized'
  | 'unreachable'

export type TestResult = 'ok' | 'unauthorized' | 'not-gowa' | 'unreachable'

export interface ConnectionState {
  baseUrl: string | null
  token: string | null
  username: string | null
  password: string | null
  status: ConnectionStatus
  connect: (baseUrl: string, username?: string, password?: string) => Promise<TestResult>
  loginWithPin: (pin: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  boot: () => Promise<void>
  disconnect: () => void
  markUnauthorized: () => void
}

export async function probeServer(
  baseUrl: string,
  token?: string,
  username?: string,
  password?: string,
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else if (username && password) {
      headers.Authorization = basicAuthHeader(username, password)
    }

    const response = await axios.get<ResponseData<unknown>>(`${baseUrl}/devices`, {
      timeout: 5_000,
      validateStatus: () => true,
      headers,
    })
    if (response.status === 401) return 'unauthorized'
    const body = response.data
    if (response.status === 200 && typeof body === 'object' && body !== null && 'code' in body) {
      return 'ok'
    }
    return 'not-gowa'
  } catch {
    return 'unreachable'
  }
}

export const useConnection = create<ConnectionState>()(
  persist(
    (set, get) => ({
      baseUrl: null,
      token: null,
      username: null,
      password: null,
      status: 'booting',

      connect: async (rawUrl, username, password) => {
        const baseUrl = normalizeBaseUrl(rawUrl)
        const result = await probeServer(baseUrl, undefined, username, password)
        if (result === 'ok') {
          set({
            baseUrl,
            username: username || null,
            password: password || null,
            status: 'connected',
          })
        }
        return result
      },

      loginWithPin: async (pin: string) => {
        const targetUrl = get().baseUrl || sameOriginBaseUrl() || ''
        try {
          const response = await axios.post<ResponseData<{ token: string }>>(
            `${targetUrl}/auth/login`,
            { pin },
            { timeout: 10_000, validateStatus: () => true },
          )
          if (response.status === 200 && response.data?.code === 'SUCCESS') {
            const token = response.data.results?.token || pin
            set({
              baseUrl: targetUrl,
              token,
              status: 'connected',
            })
            return { ok: true }
          }
          return { ok: false, error: response.data?.message || 'PIN salah' }
        } catch {
          return { ok: false, error: 'Gagal terhubung ke server' }
        }
      },

      logout: async () => {
        const targetUrl = get().baseUrl || sameOriginBaseUrl() || ''
        try {
          await axios.post(`${targetUrl}/auth/logout`, {}, { timeout: 5_000, validateStatus: () => true })
        } catch {
        }
        set({ token: null, username: null, password: null, status: 'unauthorized' })
      },

      boot: async () => {
        const { baseUrl, token, username, password } = get()
        const origin = sameOriginBaseUrl()
        const targetUrl = baseUrl || origin

        if (targetUrl) {
          const stored = await probeServer(targetUrl, token ?? undefined, username ?? undefined, password ?? undefined)
          if (stored === 'ok') {
            set({ baseUrl: targetUrl, status: 'connected' })
            return
          }
          if (stored === 'unauthorized') {
            set({ baseUrl: targetUrl, status: 'unauthorized' })
            return
          }
        }

        const defaultServer = normalizeBaseUrl(
          (import.meta.env.VITE_DEFAULT_SERVER_URL as string | undefined) ||
            'http://localhost:3000',
        )
        if (defaultServer && defaultServer !== origin) {
          const defRes = await probeServer(defaultServer, token ?? undefined)
          if (defRes === 'ok') {
            set({ baseUrl: defaultServer, status: 'connected' })
            return
          }
          if (defRes === 'unauthorized') {
            set({ baseUrl: defaultServer, status: 'unauthorized' })
            return
          }
        }

        if (origin.includes(':5173')) {
          const gowaProxy = `${origin}/gowa`
          const proxyRes = await probeServer(gowaProxy, token ?? undefined)
          if (proxyRes === 'ok') {
            set({ baseUrl: gowaProxy, status: 'connected' })
            return
          }
          if (proxyRes === 'unauthorized') {
            set({ baseUrl: gowaProxy, status: 'unauthorized' })
            return
          }
        }

        set({ baseUrl: targetUrl || origin, status: 'unauthorized' })
      },

      disconnect: () =>
        set({ baseUrl: null, token: null, username: null, password: null, status: 'unauthorized' }),

      markUnauthorized: () => {
        if (get().status === 'connected') set({ status: 'unauthorized' })
      },
    }),
    {
      name: 'gowa-ui.connection.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ baseUrl, token, username, password }) => ({ baseUrl, token, username, password }),
    },
  ),
)
