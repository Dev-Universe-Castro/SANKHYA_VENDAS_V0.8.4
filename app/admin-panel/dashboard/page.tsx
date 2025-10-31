"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Key, Clock, Activity, LogOut, RefreshCw, AlertCircle, Shield, Settings } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface TokenInfo {
  token: string
  createdAt: string
  expiresIn: number
  remainingTime: number
}

interface ApiLog {
  id: string
  timestamp: string
  method: string
  url: string
  status: number
  duration: number
  tokenUsed: boolean
}

export default function AdminPanelDashboard() {
  const router = useRouter()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const envVars = {
    SANKHYA_TOKEN: process.env.NEXT_PUBLIC_SANKHYA_TOKEN || process.env.SANKHYA_TOKEN,
    SANKHYA_APPKEY: process.env.NEXT_PUBLIC_SANKHYA_APPKEY || process.env.SANKHYA_APPKEY,
    SANKHYA_USERNAME: process.env.NEXT_PUBLIC_SANKHYA_USERNAME || process.env.SANKHYA_USERNAME,
    SANKHYA_PASSWORD: process.env.NEXT_PUBLIC_SANKHYA_PASSWORD || process.env.SANKHYA_PASSWORD,
  };

  const [renovandoToken, setRenovandoToken] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    const isAuthenticated = sessionStorage.getItem("admin_authenticated")
    if (!isAuthenticated) {
      router.push("/admin-panel")
      return
    }

    // Carregar dados iniciais
    fetchTokenInfo()
    fetchApiLogs()

    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      fetchTokenInfo()
      fetchApiLogs()
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  const fetchTokenInfo = async () => {
    try {
      const response = await fetch('/api/admin/token-info')
      if (response.ok) {
        const data = await response.json()
        console.log('Token info recebido:', data)

        // Verificar se tem token válido
        if (data && data.token) {
          setTokenInfo(data)
        } else {
          setTokenInfo(null)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações do token:', error)
      setTokenInfo(null)
    }
  }

  const fetchApiLogs = async () => {
    try {
      const response = await fetch('/api/admin/api-logs')
      if (response.ok) {
        const data = await response.json()
        setApiLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Erro ao buscar logs da API:', error)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated")
    router.push("/admin-panel")
  }

  const handleBackToLogin = () => {
    sessionStorage.removeItem("admin_authenticated")
    router.push("/admin-panel")
  }

  const handleRefreshToken = async () => {
    setRenovandoToken(true);
    try {
      const response = await fetch('/api/admin/refresh-token', { method: 'POST' })
      if (response.ok) {
        toast.success("Token renovado com sucesso")
        fetchTokenInfo()
      } else {
        toast.error("Erro ao renovar token")
      }
    } catch (error) {
      toast.error("Erro ao renovar token")
    } finally {
      setRenovandoToken(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500"
    if (status >= 400 && status < 500) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "oklch(0.32 0.02 235)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Painel Administrativo
              </CardTitle>
              <CardDescription>
                Gerenciamento do sistema Sankhya - Logs Globais do Servidor
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBackToLogin} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Variáveis de Ambiente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Variáveis de Ambiente
            </CardTitle>
            <CardDescription>Credenciais configuradas no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-white font-medium">SANKHYA_TOKEN</p>
                <p className="font-mono text-sm text-white bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {envVars.SANKHYA_TOKEN || "Não configurado"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white font-medium">SANKHYA_APPKEY</p>
                <p className="font-mono text-sm text-white bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {envVars.SANKHYA_APPKEY || "Não configurado"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white font-medium">SANKHYA_USERNAME</p>
                <p className="font-mono text-sm text-white bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {envVars.SANKHYA_USERNAME || "Não configurado"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white font-medium">SANKHYA_PASSWORD</p>
                <p className="font-mono text-sm text-white bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {"•".repeat(12)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Atual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Bearer Token Atual
                </CardTitle>
                <CardDescription>Token de autenticação ativo</CardDescription>
              </div>
              <Button onClick={handleRefreshToken} disabled={isLoading} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Renovar Token
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tokenInfo && tokenInfo.token ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-white font-medium">Token</p>
                  <p className="font-mono text-sm text-white bg-gray-100 dark:bg-gray-800 p-3 rounded break-all">
                    {tokenInfo.token}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">Criado em</p>
                    <p className="text-sm text-white font-medium">
                      {tokenInfo.createdAt ? new Date(tokenInfo.createdAt).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">Expira em</p>
                    <Badge variant={tokenInfo.remainingTime < 300 ? "destructive" : "default"}>
                      {formatTime(tokenInfo.remainingTime)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">Status</p>
                    <Badge variant={tokenInfo.remainingTime > 0 ? "default" : "destructive"}>
                      {tokenInfo.remainingTime > 0 ? "Ativo" : "Expirado"}
                    </Badge>
                  </div>
                </div>
                {tokenInfo.remainingTime < 300 && tokenInfo.remainingTime > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <p className="text-sm text-yellow-500">Token próximo de expirar. Considere renovar.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <AlertCircle className="w-12 h-12 text-gray-400" />
                <p className="text-sm text-gray-500">Nenhum token ativo no momento</p>
                <p className="text-xs text-gray-400">O token será gerado automaticamente na próxima requisição à API</p>
                <Button onClick={handleRefreshToken} size="sm" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Token Agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs de API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Logs Globais da API Sankhya
            </CardTitle>
            <CardDescription>
              Últimos 100 logs de requisições do servidor (todos os usuários)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {apiLogs.length > 0 ? (
                  apiLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.method}
                          </Badge>
                          <span className={`font-mono text-xs ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                          {log.tokenUsed && (
                            <Badge variant="secondary" className="text-xs">
                              <Key className="w-3 h-3 mr-1" />
                              Token
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{log.duration}ms</span>
                      </div>
                      <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                        {log.url}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Nenhum log disponível</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}