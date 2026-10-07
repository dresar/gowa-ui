import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { onWsEvent } from '@/lib/events'
import { wsClient } from '@/lib/ws'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'
import AccountPage from '@/pages/account'
import ChatsPage from '@/pages/chats'
import ConnectPage from '@/pages/connect'
import DashboardPage from '@/pages/dashboard'
import GroupsPage from '@/pages/groups'
import MessagingPage from '@/pages/messaging'
import MiscPage from '@/pages/misc'
import SettingsPage from '@/pages/settings'
import ScheduledPage from '@/pages/scheduled'
import BotAutoRepliesPage from '@/pages/bot-auto-replies'
import BotAIPage from '@/pages/bot-ai'
import BotAIPersonaPage from '@/pages/bot-ai-persona-page'
import BotMenuPage from '@/pages/bot-menu'
import BotMenuDetailPage from '@/pages/bot-menu-detail-page'
import BotGroupsPage from '@/pages/bot-groups'
import BotLogsPage from '@/pages/bot-logs'
import IntegrationsPage from '@/pages/integrations'

function useBootstrap() {
  const queryClient = useQueryClient()

  useEffect(() => {
    void useConnection.getState().boot()
  }, [])

  useEffect(() => {
    wsClient.sync()
    const unsubscribeConnection = useConnection.subscribe(() => wsClient.sync())
    const unsubscribeDevice = useDeviceStore.subscribe(() => wsClient.sync())
    return () => {
      unsubscribeConnection()
      unsubscribeDevice()
      wsClient.stop()
    }
  }, [])

  useEffect(
    () =>
      onWsEvent((event) => {
        switch (event.code) {
          case 'LOGIN_SUCCESS':
          case 'LIST_DEVICES':
          case 'DEVICE_LOGGED_OUT':
            void queryClient.invalidateQueries({ queryKey: ['devices'] })
            break
          case 'DEVICE_REMOVED': {
            void queryClient.invalidateQueries({ queryKey: ['devices'] })
            const removed = (event.result as { device_id?: string } | null)?.device_id
            const { selectedDeviceId, selectDevice } = useDeviceStore.getState()
            if (removed && removed === selectedDeviceId) selectDevice(null)
            break
          }
          default:
            break
        }
      }),
    [queryClient],
  )
}

function App() {
  useBootstrap()

  return (
    <Routes>
      <Route path="/connect" element={<ConnectPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/scheduled" element={<ScheduledPage />} />
        <Route path="/send" element={<Navigate to="/messaging" replace />} />
        <Route path="/messages" element={<Navigate to="/messaging" replace />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/misc" element={<MiscPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/bot/auto-replies" element={<BotAutoRepliesPage />} />
        <Route path="/bot/rules" element={<Navigate to="/bot/auto-replies" replace />} />
        <Route path="/bot/menu" element={<BotMenuPage />} />
        <Route path="/bot/menu/:id" element={<BotMenuDetailPage />} />
        <Route path="/bot/ai" element={<BotAIPage />} />
        <Route path="/bot/ai/new" element={<BotAIPersonaPage />} />
        <Route path="/bot/ai/:phone" element={<BotAIPersonaPage />} />
        <Route path="/bot/groups" element={<BotGroupsPage />} />
        <Route path="/bot/logs" element={<BotLogsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/webhook" element={<Navigate to="/integrations" replace />} />
        <Route path="/mcp" element={<Navigate to="/integrations" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
