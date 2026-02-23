# Specification

## Summary
**Goal:** Stabilize transport layer with robust error handling, retry logic, and fallback mechanisms to prevent engine crashes from network failures.

**Planned changes:**
- Implement safeFetch utility with 5000ms timeout, 2 retries with 500ms delay, and graceful null returns
- Replace all Binance API fetch calls with safeFetch, change base URL to https://api.binance.com
- Consolidate universe fetching into single fetchUniverse24h function with validation and empty array fallback
- Lower volume filter threshold to 5,000,000, add UNIVERSE_FALLBACK logic for zero-result scenarios (take first 20 USDT pairs)
- Add 300ms delay between per-symbol kline fetches only (not entire engine loop)
- Handle all safeFetch null returns gracefully in engineLoop.ts (log failures, skip symbols, never crash)
- Add new log event types: FETCH_RETRY, FETCH_FAIL, UNIVERSE_EMPTY, UNIVERSE_FALLBACK, TOP5_REFRESH_FAIL, TOP5_SKIP_EMPTY
- Update LogsTab.tsx to display new events with color coding (red for failures, yellow for warnings)

**User-visible outcome:** The engine runs continuously without crashes from network errors, with detailed logs showing retry attempts, failures, and fallback behavior. The system gracefully handles API unavailability and continues trading operations.
