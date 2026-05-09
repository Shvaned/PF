# HireReady — Payments & Subscriptions

## Paddle Integration
- Provider: Paddle (manual implementation, not platform-native)
- Price: $9.99/month
- Billing model: Subscription (recurring)

## Paddle Permissions (Least Privilege)
- Customers: Read, Write
- Products: Read
- Prices: Read
- Subscriptions: Read, Write
- Transactions: Read
- Customer portal sessions: Write
- Notifications: Read
- Notification settings: Read

## Flow

### Checkout
1. User clicks "Upgrade to Premium" on `/premium` or any premium CTA
2. Paddle checkout opens with price ID from `PADDLE_PRICE_ID`
3. On success, Paddle sends `subscription.activated` webhook
4. Webhook handler updates Subscription record + sets `isPremium = true` on User

### Webhook Events Handled
| Event | Action |
|-------|--------|
| `subscription.activated` | Create/update Subscription, set isPremium=true |
| `subscription.updated` | Update Subscription status/period, sync isPremium |
| `subscription.canceled` | Update Subscription status, set isPremium=false |
| `subscription.past_due` | Update Subscription status (keep isPremium until canceled) |

### Webhook Verification
- HMAC SHA-256 signature verification via `verifyWebhook()` in `src/lib/paddle.ts`
- Signature passed in `paddle-signature` header
- Secret stored in `PADDLE_WEBHOOK_SECRET` env var

### Entitlement Check
- `isPremium` boolean on User model (set by webhook, read by session callback)
- Session callback enriches `session.user.isPremium` on every request
- API routes check `isPremium` before premium-gated operations
- `isPremiumActive()` helper in `src/lib/paddle.ts` for manual checks

## Environment Variables
```
PADDLE_API_KEY=""           # Paddle API key (server-side only)
PADDLE_WEBHOOK_SECRET=""    # Webhook signing secret
PADDLE_PRODUCT_ID=""        # Paddle product ID
PADDLE_PRICE_ID=""          # Paddle price ID for $9.99/mo
```

## Subscription States
- **active** — Paid and current (isPremium = true)
- **trialing** — In trial period (isPremium = true)
- **past_due** — Payment failed, grace period (isPremium = true until canceled)
- **canceled** — Canceled or expired (isPremium = false)
- **inactive** — No active subscription (isPremium = false)
