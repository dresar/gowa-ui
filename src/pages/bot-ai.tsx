import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  Brain,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  chatWithAI,
  executeTool,
  getAIConfig,
  listTools,
  updateAIConfig,
  type AIChatMessage,
} from '@/api/bot'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const DEFAULT_TOOL_PAYLOADS: Record<string, string> = {
  send_message: JSON.stringify(
    {
      recipient: '628123456789@s.whatsapp.net',
      message: 'Hello from autonomous AI agent',
      media_type: 'text',
    },
    null,
    2,
  ),
  manage_group: JSON.stringify(
    {
      action: 'get_info',
      group_jid: '120363000@g.us',
    },
    null,
    2,
  ),
  query_chats: JSON.stringify(
    {
      action: 'list_chats',
      limit: 10,
    },
    null,
    2,
  ),
  update_rules: JSON.stringify(
    {
      action: 'create_rule',
      rule_data: {
        trigger_type: 'contains',
        trigger_value: 'promo',
        scope: 'all',
        response_type: 'text',
        response_content: 'Use code DISKON50 for 50% discount!',
      },
    },
    null,
    2,
  ),
}

export default function BotAIPage() {
  const queryClient = useQueryClient()
  const [showKey, setShowKey] = useState(false)

  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [triggerPrefix, setTriggerPrefix] = useState('!ai')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatModel, setChatModel] = useState('')
  const [chatTemp, setChatTemp] = useState<string>('')
  const [lastUsage, setLastUsage] = useState<{ total_tokens?: number; latency_ms?: number } | null>(null)

  const [selectedTool, setSelectedTool] = useState<string>('send_message')
  const [toolParamsJson, setToolParamsJson] = useState<string>(DEFAULT_TOOL_PAYLOADS['send_message'])
  const [toolOutput, setToolOutput] = useState<string>('')
  const [toolLatency, setToolLatency] = useState<number | null>(null)

  useQuery({
    queryKey: ['bot-ai-config'],
    queryFn: async () => {
      const cfg = await getAIConfig()
      if (!isConfigLoaded && cfg) {
        setProvider(cfg.provider || 'openai')
        setBaseUrl(cfg.base_url || 'https://api.openai.com/v1')
        setApiKey(cfg.api_key || '')
        setModel(cfg.model || 'gpt-4o-mini')
        setSystemPrompt(cfg.system_prompt || '')
        setTemperature(cfg.temperature ?? 0.7)
        setTriggerPrefix(cfg.trigger_prefix || '!ai')
        setAutoReplyEnabled(cfg.auto_reply_enabled || false)
        setIsConfigLoaded(true)
      }
      return cfg
    },
  })

  const { data: tools = [] } = useQuery({
    queryKey: ['bot-ai-tools'],
    queryFn: listTools,
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
      }),
    onSuccess: () => {
      toast.success('Configuration saved')
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-config'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Save failed')
    },
  })

  const chatMutation = useMutation({
    mutationFn: async () => {
      const tempNum = chatTemp !== '' ? Number(chatTemp) : undefined
      return chatWithAI({
        message: chatInput.trim(),
        chat_history: chatMessages,
        model: chatModel.trim() || undefined,
        temperature: tempNum,
      })
    },
    onSuccess: (res) => {
      const userMsg: AIChatMessage = { role: 'user', content: chatInput.trim() }
      const assistantMsg: AIChatMessage = { role: 'assistant', content: res.reply }
      setChatMessages((prev) => [...prev, userMsg, assistantMsg])
      setChatInput('')
      setLastUsage({
        total_tokens: res.usage?.total_tokens,
        latency_ms: res.latency_ms,
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'AI chat failed')
    },
  })

  const toolMutation = useMutation({
    mutationFn: async () => {
      let params = {}
      try {
        params = JSON.parse(toolParamsJson)
      } catch {
        throw new Error('Invalid JSON parameters')
      }
      return executeTool({
        tool: selectedTool,
        parameters: params,
      })
    },
    onSuccess: (res) => {
      setToolOutput(JSON.stringify(res.output, null, 2))
      setToolLatency(res.latency_ms)
      toast.success('Tool executed')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Tool execution failed')
    },
  })

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName)
    if (DEFAULT_TOOL_PAYLOADS[toolName]) {
      setToolParamsJson(DEFAULT_TOOL_PAYLOADS[toolName])
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="AI Assistant"
        description="Models and tools"
        actions={
          <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 text-xs gap-1.5 py-1">
            <Sparkles className="size-3.5" />
            <span>Autonomous</span>
          </Badge>
        }
      />

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60">
          <TabsTrigger value="chat" className="gap-1.5 text-xs">
            <Brain className="size-3.5" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 text-xs">
            <Sparkles className="size-3.5" />
            <span>Config</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5 text-xs">
            <Wrench className="size-3.5" />
            <span>Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">Console</CardTitle>
                {lastUsage && (
                  <Badge variant="secondary" className="text-[11px] font-mono">
                    {lastUsage.latency_ms}ms · {lastUsage.total_tokens || 0} tokens
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatMessages([])
                  setLastUsage(null)
                }}
                className="h-7 text-xs rounded-[5px] gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Clear</span>
              </Button>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              <ScrollArea className="h-[360px] rounded-lg border border-border/50 bg-background/50 p-4">
                {chatMessages.length === 0 ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <Bot className="size-8 text-red-500/40" />
                    <p className="text-xs">No messages</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-mono text-muted-foreground">
                          {msg.role}
                        </span>
                        <div
                          className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'border border-border/60 bg-card/80 text-foreground'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                  placeholder="Model"
                  className="h-8 text-xs rounded-[6px] font-mono"
                />
                <Input
                  value={chatTemp}
                  onChange={(e) => setChatTemp(e.target.value)}
                  placeholder="Temperature"
                  className="h-8 text-xs rounded-[6px] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
                      e.preventDefault()
                      chatMutation.mutate()
                    }
                  }}
                  placeholder="Message"
                  className="h-9 text-xs rounded-[6px]"
                />
                <Button
                  size="sm"
                  onClick={() => chatMutation.mutate()}
                  disabled={chatMutation.isPending || !chatInput.trim()}
                  className="h-9 gap-1.5 rounded-[6px] bg-red-600 px-4 text-xs text-white hover:bg-red-700 shadow-xs"
                >
                  <Send className="size-3.5" />
                  <span>Send</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">AI Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Provider</Label>
                  <Input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Provider"
                    className="h-8 text-xs rounded-[6px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Model"
                    className="h-8 text-xs rounded-[6px] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Base URL</Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="URL"
                  className="h-8 text-xs rounded-[6px] font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Key"
                    className="h-8 pr-8 text-xs rounded-[6px] font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 size-8 text-muted-foreground"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Trigger Prefix</Label>
                  <Input
                    value={triggerPrefix}
                    onChange={(e) => setTriggerPrefix(e.target.value)}
                    placeholder="Prefix"
                    className="h-8 text-xs rounded-[6px] font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                    placeholder="Temperature"
                    className="h-8 text-xs rounded-[6px] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">System Prompt</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Prompt"
                  className="min-h-[90px] text-xs rounded-[6px]"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/20">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs font-semibold">Auto Reply</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Auto reply to messages
                  </span>
                </div>
                <Switch
                  checked={autoReplyEnabled}
                  onCheckedChange={setAutoReplyEnabled}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                  className="h-8 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs px-6"
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Tools</CardTitle>
              {toolLatency !== null && (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500 text-[11px] font-mono">
                  {toolLatency}ms
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Tool</Label>
                <Select value={selectedTool} onValueChange={handleToolChange}>
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((t) => (
                      <SelectItem key={t.name} value={t.name} className="text-xs font-mono">
                        {t.name}
                      </SelectItem>
                    ))}
                    {tools.length === 0 && (
                      <>
                        <SelectItem value="send_message">send_message</SelectItem>
                        <SelectItem value="manage_group">manage_group</SelectItem>
                        <SelectItem value="query_chats">query_chats</SelectItem>
                        <SelectItem value="update_rules">update_rules</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Parameters</Label>
                <Textarea
                  value={toolParamsJson}
                  onChange={(e) => setToolParamsJson(e.target.value)}
                  placeholder="JSON"
                  className="min-h-[140px] font-mono text-xs rounded-[6px]"
                />
              </div>

              <div className="flex justify-start">
                <Button
                  size="sm"
                  onClick={() => toolMutation.mutate()}
                  disabled={toolMutation.isPending}
                  className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
                >
                  <Play className="size-3" />
                  <span>Execute</span>
                </Button>
              </div>

              {toolOutput && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <Label className="text-xs font-medium">Output</Label>
                  <pre className="max-h-[200px] overflow-auto rounded-lg border border-border/50 bg-background/80 p-3 font-mono text-xs text-foreground">
                    {toolOutput}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
