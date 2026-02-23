// Binance API response types
export interface ExchangeInfo {
  symbols: SymbolInfo[];
}

export interface SymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface Ticker24hr {
  symbol: string;
  quoteVolume: string;
}

export interface KlineRaw {
  0: number; // openTime
  1: string; // open
  2: string; // high
  3: string; // low
  4: string; // close
  5: string; // volume
  6: number; // closeTime
  7: string; // quoteAssetVolume
  8: number; // numberOfTrades
  9: string; // takerBuyBaseAssetVolume
  10: string; // takerBuyQuoteAssetVolume
  11: string; // ignore
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  closeTime: number;
}
