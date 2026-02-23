// Safe fetch utility with timeout, retry logic, and comprehensive error handling
import { useEngineStore } from '../store/engineStore';

const BASE_URL = 'https://fapi.binance.com';
const TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 500;

export async function safeFetch(
  url: string,
  options?: RequestInit,
  retries: number = 2
): Promise<any | null> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (!isLastAttempt) {
        // Log retry event
        const store = useEngineStore.getState();
        store.addLog('FETCH_RETRY', {
          url: fullUrl,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        // Log final failure
        const store = useEngineStore.getState();
        store.addLog('FETCH_FAIL', {
          url: fullUrl,
          error: error instanceof Error ? error.message : String(error)
        });
        
        return null;
      }
    }
  }
  
  return null;
}
