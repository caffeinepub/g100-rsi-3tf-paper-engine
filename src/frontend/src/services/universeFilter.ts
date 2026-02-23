// Universe filtering and TOP5 selection with fallback logic
import type { Universe24hTicker } from './binanceApi';
import { useEngineStore } from '../store/engineStore';

const STABLE_PATTERNS = ['USD', 'USDC', 'FDUSD', 'TUSD', 'USDP', 'DAI', 'BUSD', 'UST', 'EUR', 'GBP', 'PAX', 'USD1'];
const EXCLUDED_MAJORS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
const MIN_VOLUME = 5_000_000;

export function filterUniverse(tickers: Universe24hTicker[]): {
  candidateSymbols: string[];
  beforeCount: number;
  afterCount: number;
} {
  // Filter to USDT pairs only for counting
  const usdtPairs = tickers.filter(t => t.symbol.endsWith('USDT'));
  const beforeCount = usdtPairs.length;
  
  const filtered = tickers.filter(ticker => {
    const symbol = ticker.symbol;
    const volume = Number(ticker.quoteVolume);
    
    // Must end with USDT
    if (!symbol.endsWith('USDT')) return false;
    
    // Volume filter
    if (volume < MIN_VOLUME) return false;
    
    // Exclude majors
    if (EXCLUDED_MAJORS.includes(symbol)) {
      return false;
    }
    
    // Exclude stables/wrappers (case-insensitive)
    const upperSymbol = symbol.toUpperCase();
    for (const pattern of STABLE_PATTERNS) {
      if (upperSymbol.includes(pattern.toUpperCase())) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort by quoteVolume descending
  filtered.sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
  
  let candidateSymbols = filtered.slice(0, 5).map(t => t.symbol);
  const afterCount = candidateSymbols.length;
  
  // Log filtering results
  const store = useEngineStore.getState();
  store.addLog('UNIVERSE_FILTERED', { before: beforeCount, after: afterCount });
  
  // Fallback logic if filtering produces empty results
  if (candidateSymbols.length === 0) {
    store.addLog('UNIVERSE_FALLBACK', { reason: 'filtered array empty, using first 20 USDT pairs' });
    
    // Take first 20 USDT pairs without volume filter
    candidateSymbols = usdtPairs.slice(0, 20).map(t => t.symbol);
  }
  
  return {
    candidateSymbols,
    beforeCount,
    afterCount
  };
}
