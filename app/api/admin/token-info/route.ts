import { NextResponse } from 'next/server';
import { redisCacheService } from '@/lib/redis-cache-service';

interface TokenCache {
  token: string;
  expiresAt: number;
  geradoEm: string;
}

export async function GET() {
  try {
    console.log('🔍 [API /admin/token-info] Buscando informações do token do servidor...');

    // Buscar token do Redis (cache compartilhado do servidor)
    const tokenCache = await redisCacheService.get<TokenCache>('sankhya:token');

    console.log('📦 [API /admin/token-info] Token do Redis:', tokenCache ? {
      hasToken: !!tokenCache.token,
      geradoEm: tokenCache.geradoEm,
      expiresAt: new Date(tokenCache.expiresAt).toISOString()
    } : 'null');

    if (!tokenCache || !tokenCache.token) {
      console.log('⚠️ [API /admin/token-info] Nenhum token disponível no cache do servidor');
      return NextResponse.json({
        token: null,
        ativo: false,
        mensagem: 'Nenhum token disponível. O token será gerado na próxima requisição.'
      });
    }

    const now = Date.now();
    const remainingTime = Math.max(0, Math.floor((tokenCache.expiresAt - now) / 1000));
    const ativo = remainingTime > 0;

    const tokenInfo = {
      token: tokenCache.token,
      createdAt: tokenCache.geradoEm,
      expiresIn: 1200, // 20 minutos em segundos
      remainingTime: remainingTime,
      ativo: ativo
    };

    console.log('✅ [API /admin/token-info] Token info do servidor:', {
      ativo: tokenInfo.ativo,
      remainingTime: tokenInfo.remainingTime,
      createdAt: tokenInfo.createdAt
    });

    return NextResponse.json(tokenInfo);
  } catch (erro: any) {
    console.error('❌ [API /admin/token-info] Erro ao buscar token:', erro.message);
    return NextResponse.json({
      token: null,
      ativo: false,
      mensagem: `Erro: ${erro.message}`
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';