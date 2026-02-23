// Universe filtering and TOP5 selection with fallback logic for Futures USDT-M
import type { Universe24hTicker } from './binanceApi';
import { useEngineStore } from '../store/engineStore';

const STABLE_PATTERNS = ['USD', 'FDUSD', 'TUSD', 'USDP', 'DAI', 'BUSD', 'UST', 'EUR', 'GBP', 'PAX', 'USD1'];
const EXCLUDED_MAJORS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
const MIN_VOLUME = 5_000_000;

// Stablecoins to exclude from base asset (stable-to-stable pairs)
const STABLECOINS = ['USDC', 'BUSD', 'TUSD', 'FDUSD', 'USDP', 'DAI', 'UST', 'PAX', 'USD1'];

export function filterUniverse(tickers: Universe24hTicker[]): {
  candidateSymbols: string[];
  beforeCount: number;
  afterCount: number;
} {
  const store = useEngineStore.getState();
  
  // DEBUG: Log first 10 raw universe elements before any filtering
  const debugSample = tickers.slice(0, 10).map(item => ({
    symbol: item.symbol,
    quoteVolume_raw: item.quoteVolume,
    typeof_quoteVolume: typeof item.quoteVolume,
    Number_quoteVolume: Number(item.quoteVolume)
  }));
  store.addLog('UNIVERSE_DEBUG_SAMPLE', debugSample);
  
  // Filter to USDT pairs only for counting
  const usdtPairs = tickers.filter(t => t.symbol.endsWith('USDT'));
  const beforeCount = usdtPairs.length;
  
  const filtered = tickers.filter(ticker => {
    const symbol = ticker.symbol;
    const vol = Number(ticker.quoteVolume);
    
    // DEBUG: Check for NaN after parsing
    if (Number.isNaN(vol)) {
      store.addLog('UNIVERSE_VOLUME_PARSE_ERROR', {
        symbol,
        quoteVolume_raw: ticker.quoteVolume
      });
    }
    
    // CRITICAL: Must end with USDT (Futures USDT-M perpetuals only)
    if (!symbol.endsWith('USDT')) return false;
    
    // CRITICAL: Explicitly exclude all USDC-containing symbols (case-insensitive)
    if (symbol.toUpperCase().includes('USDC')) return false;
    
    // CRITICAL: Exclude stable-to-stable pairs (check base asset)
    const baseAsset = symbol.slice(0, -4).toUpperCase();
    if (STABLECOINS.some(stable => baseAsset === stable.toUpperCase())) {
      return false;
    }
    
    // Volume filter (applied after proper parsing)
    if (vol < MIN_VOLUME) return false;
    
    // Exclude majors
    if (EXCLUDED_MAJORS.includes(symbol)) {
      return false;
    }
    
    // Exclude other stables/wrappers (case-insensitive)
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
  
  // DEBUG: Log filter result before/after counts
  store.addLog('UNIVERSE_FILTER_RESULT', {
    before: beforeCount,
    after: afterCount,
    volumeThreshold: MIN_VOLUME
  });
  
  // Log filtering results
  store.addLog('UNIVERSE_FILTERED', { before: beforeCount, after: afterCount });
  
  // Fallback logic if filtering produces empty results
  if (candidateSymbols.length === 0) {
    store.addLog('UNIVERSE_FALLBACK', { reason: 'filtered array empty, using top 5 USDT pairs by volume' });
    
    // CRITICAL: Fallback must respect USDT-only, no-USDC, no-stable/stable rules
    const fallbackFiltered = usdtPairs.filter(ticker => {
      const symbol = ticker.symbol;
      
      // Exclude USDC-containing symbols (case-insensitive)
      if (symbol.toUpperCase().includes('USDC')) return false;
      
      // Extract base asset (remove 'USDT' suffix)
      const baseAsset = symbol.slice(0, -4).toUpperCase();
      
      // Exclude if base asset is a stablecoin (stable-to-stable pairs)
      if (STABLECOINS.some(stable => baseAsset === stable.toUpperCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort by quoteVolume DESC and take top 5 (not 20)
    const sortedFallback = [...fallbackFiltered].sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
    candidateSymbols = sortedFallback.slice(0, 5).map(t => t.symbol);
  }
  
  return {
    candidateSymbols,
    beforeCount,
    afterCount
  };
}
