# Moralis Free Tier - Capabilities & Optimization Guide

## Your Current Free Tier Limits

- **40,000 Compute Units (CUs) per day** (~1,333 CUs/hour)
- **1,000 CUs per second** throughput (API)
- **100 CUs per second** throughput (RPC nodes)
- **No Streams API** (requires Starter+ plan)
- **Requires attribution** ("Powered by Moralis")
- **429 errors** when daily limit exceeded (not 502)

## Current API Endpoints You're Using

1. **`/account/mainnet/{address}/trades`** - Wallet swap history
2. **`/account/mainnet/{address}/portfolio`** - Wallet portfolio (tokens + USD values)
3. **`/account/mainnet/{address}/tokens`** - Token balances
4. **`/account/mainnet/{address}/transactions`** - Raw transactions (fallback)
5. **`/token/mainnet/{mint}/holders`** - Top token holders
6. **`/token/mainnet/{mint}/price`** - Token price & market data

## What You CAN Do (Within Limits)

### ✅ Currently Working Well

1. **Wallet Intelligence Pages**
   - View portfolio for any wallet
   - See recent trades (up to 80 swaps per request)
   - Check top holdings
   - Get token price data

2. **Smart Trader Tracker**
   - Browse 10,000 wallets with pagination
   - Search/filter wallets
   - View individual wallet details

3. **Live Activity Monitoring**
   - Poll up to ~20-30 wallets every 30 seconds
   - Real-time trade alerts
   - Activity feed updates

### ⚠️ Current Limitations & Issues

1. **502 Errors** - Likely due to:
   - Rate limiting (hitting 1,000 CU/sec cap)
   - API instability for pre-Sep 2024 data
   - Compute unit exhaustion

2. **Polling Overhead**
   - Each wallet poll = 1 API call every 30s
   - 10 wallets = 20 calls/minute = 28,800 calls/day
   - This can quickly consume your 2M CU monthly limit

## Optimization Strategies

### 1. **Increase Cache TTL** (Already Implemented ✅)
- Current: 60 seconds
- **Recommendation**: 
  - Portfolio: 5 minutes (changes slowly)
  - Token prices: 2 minutes
  - Top holders: 10 minutes
  - Swaps: Keep at 60s (more dynamic)

### 2. **Use Moralis Streams API** (Better than Polling!)
Instead of polling every 30s, set up **Streams** for real-time updates:

```typescript
// Benefits:
// - Only 1 stream per wallet (not repeated API calls)
// - Real-time webhooks (instant updates)
// - More efficient CU usage
// - Up to 20 streams on Starter plan
```

**Action**: Replace polling with Streams for your top 20 most-watched wallets.

### 3. **Reduce Default Limits**
- Current swaps limit: 20-80
- **Recommendation**: 
  - Default: 10 swaps (for activity feed)
  - Full view: 50 swaps (on-demand)
  - Portfolio: 50 tokens (not 200)

### 4. **Implement Request Batching**
Batch multiple wallet requests when possible:
- Instead of 10 separate calls, use a single batch endpoint if available
- Or implement client-side queuing (max 5 concurrent requests)

### 5. **Smart Polling Strategy**
- **Tier 1 wallets** (top 5): Poll every 30s
- **Tier 2 wallets** (6-20): Poll every 2 minutes
- **Tier 3 wallets** (21+): Poll every 5 minutes
- Or use Streams for Tier 1

### 6. **Client-Side Rate Limiting**
Add a rate limiter to prevent burst requests:

```typescript
// Example: Max 10 requests per 10 seconds
const rateLimiter = {
  queue: [],
  maxRequests: 10,
  windowMs: 10000,
  // ... implementation
};
```

## Estimated CU Usage

**Rough estimates** (varies by endpoint complexity):

- `/trades`: ~50-200 CUs per request
- `/portfolio`: ~100-300 CUs per request
- `/tokens`: ~50-150 CUs per request
- `/holders`: ~200-500 CUs per request
- `/price`: ~10-50 CUs per request

**Current usage pattern**:
- 10 monitored wallets × 1 call/30s = 20 calls/min = 1,200 calls/hour
- At ~100 CUs/call average = **120,000 CUs/hour**
- **2.88M CUs/day** (exceeds monthly limit!)

**With optimizations**:
- Streams for top 5 wallets: ~0 CUs (webhook-based)
- Polling for 5 wallets every 2min: 150 calls/hour = 15,000 CUs/hour
- **360K CUs/day** = **10.8M CUs/month** (still over, but better)

**Better approach**:
- Use Streams for all 20 monitored wallets
- Only poll on-demand when user views wallet page
- **Estimated: ~500K-1M CUs/month** ✅

## Recommended Next Steps

1. **Implement Moralis Streams** for real-time monitoring (replaces polling)
2. **Increase cache TTLs** for less dynamic data
3. **Add client-side rate limiting** to prevent bursts
4. **Reduce default limits** in API calls
5. **Show CU usage dashboard** to track consumption
6. **Consider upgrading** to Pro plan if you need:
   - More than 20 streams
   - Higher CU limits (10M/month)
   - Multiple projects

## Alternative: Hybrid Approach

- **Streams** (20 wallets): Real-time monitoring
- **On-demand API calls**: When user clicks "View Wallet"
- **Caching**: Aggressive caching (5-10 min TTL)
- **Fallback**: Transaction parsing for pre-Sep 2024 data

This should keep you well under the 2M CU/month limit while maintaining functionality.

