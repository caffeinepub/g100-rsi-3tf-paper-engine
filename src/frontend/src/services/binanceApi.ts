// Binance Futures REST API service with safeFetch transport layer
import type { Kline, KlineRaw } from '../types/binance';
import { safeFetch } from '../utils/safeFetch';

export interface Universe24hTicker {
  symbol: string;
  quoteVolume: string;
  [key: string]: any;
}

export async function fetchUniverse24h(): Promise<Universe24hTicker[]> {
  // Log universe source at start
  const { useEngineStore } = await import('../store/engineStore');
  useEngineStore.getState().addLog('UNIVERSE_SOURCE', {
    source: 'FUTURES_USDTM',
    endpoint: '/fapi/v1/ticker/24hr'
  });
  
  const result = await safeFetch('/fapi/v1/ticker/24hr');
  
  if (result === null) {
    useEngineStore.getState().addLog('UNIVERSE_EMPTY', { reason: 'safeFetch returned null' });
    return [];
  }
  
  if (!Array.isArray(result)) {
    useEngineStore.getState().addLog('UNIVERSE_EMPTY', { reason: 'result is not array' });
    return [];
  }
  
  return result;
}

export async function fetchKlines(
  symbol: string,
  interval: '1m' | '5m' | '15m',
  limit: number
): Promise<Kline[] | null> {
  const result = await safeFetch(
    `/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  
  if (result === null) {
    return null;
  }
  
  if (!Array.isArray(result)) {
    return null;
  }
  
  return result.map((k: any) => ({
    openTime: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    closeTime: Number(k[6])
  }));
}
