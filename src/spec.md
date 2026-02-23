# Specification

## Summary
**Goal:** Switch the G100 RSI 3TF Paper Engine universe source from Binance Spot API to Binance USDT-M Futures API with strict symbol filtering.

**Planned changes:**
- Replace base API endpoint from https://api.binance.com to https://fapi.binance.com for Futures market data
- Update universe fetch to use /fapi/v1/ticker/24hr endpoint for USDT-M perpetual contracts
- Filter universe to only include symbols ending with 'USDT' and explicitly exclude all USDC-containing symbols
- Exclude stable-to-stable pairs by checking base asset against stablecoin identifiers (USDC, BUSD, TUSD, FDUSD, USDP, DAI, UST, PAX, USD1)
- Fix volume parsing to use Number() conversion before applying 5,000,000 threshold
- Add UNIVERSE_SOURCE log event to track Futures data source
- Update fallback logic to return exactly 5 symbols (not 20) with same filtering rules
- Add UNIVERSE_SOURCE to log type definitions and display in logs panel

**User-visible outcome:** The trading engine will operate exclusively on Binance USDT-M Futures perpetual contracts, with a cleaner universe of high-volume trading pairs that excludes stablecoins and low-liquidity symbols. Users will see "UNIVERSE_SOURCE = FUTURES_USDTM" in the logs confirming the data source switch.
