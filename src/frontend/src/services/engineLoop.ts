// Main engine loop with resilient transport and error handling
import { useEngineStore } from '../store/engineStore';
import { fetchUniverse24h, fetchKlines } from './binanceApi';
import { filterUniverse } from './universeFilter';
import { calculateRSI } from './rsiCalculator';
import { evaluateEntryGates } from './entryGates';
import { calculatePosition } from './riskManager';
import { evaluateExit, createTrade } from './exitEvaluator';
import { delay } from '../utils/delay';
import type { Position } from '../types/store';

const TICK_INTERVAL_MS = 15_000; // 15 seconds
const TOP5_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const FETCH_DELAY_MS = 300;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export function startEngineLoop() {
  const store = useEngineStore.getState();
  
  if (store.engineRunning && store._intervalId !== null) {
    store.addLog('ENGINE_START_IGNORED', { reason: 'Engine already running' });
    return;
  }
  
  store.startEngine();
  
  // Run first tick immediately
  void engineTick();
  
  // Set up interval
  const intervalId = window.setInterval(() => {
    void engineTick();
  }, TICK_INTERVAL_MS);
  
  useEngineStore.setState({ _intervalId: intervalId });
}

export function stopEngineLoop() {
  const store = useEngineStore.getState();
  store.stopEngine();
}

async function engineTick() {
  const store = useEngineStore.getState();
  
  if (!store.engineRunning) return;
  
  store.addLog('ENGINE_TICK', { time: new Date().toISOString() });
  
  try {
    // Step 1: Initialize TOP5 immediately if empty, or refresh on 15-minute boundary
    const now = Date.now();
    const needsInitialization = store.top5Symbols.length === 0;
    const shouldRefresh = store._lastTop5Refresh === 0 || (now - store._lastTop5Refresh) >= TOP5_REFRESH_INTERVAL_MS;
    
    if (needsInitialization || shouldRefresh) {
      try {
        const tickers = await fetchUniverse24h();
        
        if (tickers.length === 0) {
          store.addLog('TOP5_SKIP_EMPTY', { reason: 'fetchUniverse24h returned empty array' });
        } else {
          const { candidateSymbols } = filterUniverse(tickers);
          
          store.updateTop5Symbols(candidateSymbols);
          store.addLog('TOP5_SET', { symbols: candidateSymbols });
          
          useEngineStore.setState({ _lastTop5Refresh: now });
        }
      } catch (error) {
        store.addLog('TOP5_REFRESH_FAIL', { error: String(error) });
        // Continue with existing TOP5
      }
    }
    
    // Step 2: Build engineWatchSet (TOP5 + OPEN symbols)
    const openSymbols = store.openPositions.map(p => p.symbol);
    const engineWatchSet = Array.from(new Set([...store.top5Symbols, ...openSymbols]));
    
    // Step 3: Update lastClosed1m for all watched symbols
    for (const symbol of engineWatchSet) {
      try {
        const klines = await fetchKlines(symbol, '1m', 2);
        if (klines && klines.length > 0) {
          const closedCandle = klines[0]; // Use older candle (1-candle latency)
          store.updateLastClosed1m(symbol, {
            close: closedCandle.close,
            closeTime: closedCandle.closeTime
          });
        }
        await delay(FETCH_DELAY_MS);
      } catch (error) {
        // Skip this symbol, continue with others
        continue;
      }
    }
    
    // Step 4: Compute RSI for TOP5 symbols and evaluate entries
    for (const symbol of store.top5Symbols) {
      try {
        // Fetch all timeframes with throttling between symbols
        const klines1m = await fetchKlines(symbol, '1m', 200);
        await delay(FETCH_DELAY_MS);
        
        const klines5m = await fetchKlines(symbol, '5m', 200);
        await delay(FETCH_DELAY_MS);
        
        const klines15m = await fetchKlines(symbol, '15m', 200);
        await delay(FETCH_DELAY_MS);
        
        // Skip if any fetch failed
        if (!klines1m || !klines5m || !klines15m) {
          continue;
        }
        
        // Calculate RSI
        const closes1m = klines1m.map(k => k.close);
        const closes5m = klines5m.map(k => k.close);
        const closes15m = klines15m.map(k => k.close);
        
        const rsi1m = calculateRSI(closes1m);
        const rsi5m = calculateRSI(closes5m);
        const rsi15m = calculateRSI(closes15m);
        
        // Get previous RSI1m for cross detection
        const prevCache = store.rsiCache[symbol];
        const prevRsi1m = prevCache?.rsi1m;
        
        // Update cache
        store.updateRsiCache(symbol, {
          rsi1m,
          rsi5m,
          rsi15m,
          time1m: klines1m[klines1m.length - 1]?.closeTime || 0,
          time5m: klines5m[klines5m.length - 1]?.closeTime || 0,
          time15m: klines15m[klines15m.length - 1]?.closeTime || 0,
          prevRsi1m
        });
        
        store.addLog('RSI_VALUES', { symbol, rsi1m, rsi5m, rsi15m });
        
        // Evaluate entry gates
        const gates = evaluateEntryGates({ ...store.rsiCache[symbol], prevRsi1m });
        
        store.addLog('ENTRY_CHECK', { symbol, gates });
        
        // Check for RSI cross
        if (gates.gate1mCross && prevRsi1m !== undefined) {
          store.addLog('RSI_CROSS_UP', { symbol, prev: prevRsi1m, curr: rsi1m });
        }
        
        // Attempt entry if all gates pass
        if (gates.allGatesPass) {
          const lastClosed = store.lastClosed1m[symbol];
          if (lastClosed) {
            const posCalc = calculatePosition(
              symbol,
              lastClosed.close,
              store.equity,
              store.openPositions,
              store.cooldowns
            );
            
            if (posCalc.valid && posCalc.entryPrice) {
              const newPosition: Position = {
                id: `${symbol}-${Date.now()}`,
                symbol,
                entryTime: Date.now(),
                entryPrice: posCalc.entryPrice,
                stopPrice: posCalc.stopPrice!,
                tp1: posCalc.tp1!,
                tp2: posCalc.tp2!,
                qty: posCalc.qty!,
                notional: posCalc.notional!,
                margin: posCalc.margin!,
                tp1Hit: false
              };
              
              store.updateOpenPositions([...store.openPositions, newPosition]);
              store.addLog('TRADE_OPEN', {
                symbol,
                entry: posCalc.entryPrice,
                sl: posCalc.stopPrice,
                tp1: posCalc.tp1,
                tp2: posCalc.tp2,
                qty: posCalc.qty,
                margin: posCalc.margin
              });
            } else {
              store.addLog('REJECT', { symbol, reason: posCalc.reason });
            }
          }
        }
        
        // Update prevRsi1m for next tick
        store.updateRsiCache(symbol, {
          ...store.rsiCache[symbol],
          prevRsi1m: rsi1m
        });
        
      } catch (error) {
        // Skip this symbol, continue with others
        continue;
      }
    }
    
    // Step 5: Evaluate exits for open positions
    const updatedPositions: Position[] = [];
    const newCooldowns = { ...store.cooldowns };
    
    for (const position of store.openPositions) {
      const lastClosed = store.lastClosed1m[position.symbol];
      if (!lastClosed) {
        updatedPositions.push(position);
        continue;
      }
      
      const exitResult = evaluateExit(position, lastClosed.close, Date.now());
      
      if (exitResult.tp1Hit && !position.tp1Hit) {
        store.addLog('TP1_HIT', { symbol: position.symbol });
        updatedPositions.push({ ...position, tp1Hit: true });
        continue;
      }
      
      if (exitResult.shouldExit && exitResult.exitReason && exitResult.exitPrice) {
        const trade = createTrade(position, exitResult.exitPrice, exitResult.exitReason, Date.now());
        
        const newEquity = store.equity + trade.pnlUSDT;
        store.updateEquity(newEquity);
        store.addTrade(trade);
        
        store.addLog(exitResult.exitReason, { symbol: position.symbol, price: exitResult.exitPrice });
        store.addLog('TRADE_CLOSED', { pnlUSDT: trade.pnlUSDT, equity: newEquity });
        
        // Add cooldown only for SL
        if (exitResult.exitReason === 'SL_HIT') {
          newCooldowns[position.symbol] = Date.now() + COOLDOWN_MS;
        }
      } else {
        updatedPositions.push(position);
      }
    }
    
    store.updateOpenPositions(updatedPositions);
    store.updateCooldowns(newCooldowns);
    
  } catch (error) {
    // Log error but never crash engine
    store.addLog('FETCH_FAIL', { error: String(error), context: 'engineTick' });
  }
}
