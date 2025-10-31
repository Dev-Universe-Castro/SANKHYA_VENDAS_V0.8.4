import { NextResponse } from 'next/server';
import { redisCacheService } from '@/lib/redis-cache-service';

const API_LOGS_KEY = 'global:server:api_logs:sankhya';
const MAX_LOGS = 100; // Aumentado para 100 logs globais

export async function addApiLog(log: {
  method: string;
  url: string;
  status: number;
  duration: number;
  tokenUsed: boolean;
  error?: string;
}) {
  const newLog = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    ...log,
    error: log.error || null
  };

  try {
    // Buscar logs existentes do Redis (CACHE GLOBAL DO SERVIDOR)
    const existingLogs = await redisCacheService.get<any[]>(API_LOGS_KEY) || [];

    // Adicionar novo log no início
    existingLogs.unshift(newLog);

    // Manter apenas os últimos 100 logs
    const updatedLogs = existingLogs.slice(0, MAX_LOGS);

    // Salvar de volta no Redis - SEM EXPIRAÇÃO (logs permanentes do servidor)
    await redisCacheService.set(API_LOGS_KEY, updatedLogs, 365 * 24 * 60 * 60); // 1 ano

    const statusEmoji = log.status >= 400 ? '❌' : '✅';
    const errorInfo = log.error ? ` | Erro: ${log.error}` : '';
    console.log(`${statusEmoji} [GLOBAL SERVER LOG] ${log.method} ${log.url} - ${log.status}${errorInfo}`);
  } catch (error) {
    console.error('❌ Erro ao adicionar log global do servidor:', error);
  }
}

export async function GET() {
  try {
    console.log('📋 [GLOBAL] Buscando logs globais do servidor...');

    // Buscar logs do Redis (CACHE GLOBAL COMPARTILHADO DO SERVIDOR)
    const apiLogs = await redisCacheService.get<any[]>(API_LOGS_KEY) || [];

    console.log(`✅ [API /admin/api-logs] ${apiLogs.length} logs globais do servidor encontrados`);

    return NextResponse.json({
      logs: apiLogs,
      total: apiLogs.length,
      isGlobal: true, // Indicador de que são logs globais
      message: 'Logs globais do servidor - não filtrados por usuário'
    });
  } catch (error) {
    console.error('❌ [API /admin/api-logs] Erro ao obter logs globais:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';