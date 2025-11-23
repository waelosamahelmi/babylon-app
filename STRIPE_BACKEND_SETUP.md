# Stripe Backend Integration - Setup Guide

## What Changed?

✅ **Moved Stripe payments from Supabase Edge Functions to Express Backend**

This solves the CORS issues you were experiencing and provides better control over payment processing.

## Architecture

```
Frontend (babylon-web)          Backend (babylon-app/server)         Stripe API
    ↓                                  ↓                                ↓
stripe-api.ts  →  HTTP POST  →  /api/stripe/create-payment-intent  →  Stripe
    ↑                                  ↓                                ↓
Returns clientSecret   ←────────  Backend processes  ←──────────  Payment Intent
```

## Files Created/Modified

### Created:
1. **`babylon-app/server/stripe.ts`** - Stripe backend logic
   - `createPaymentIntent()` - Creates Stripe payment intent
   - `confirmPayment()` - Confirms payment
   - `getPaymentIntent()` - Gets payment status
   - `handleWebhook()` - Handles Stripe webhooks

### Modified:
2. **`babylon-app/server/routes.ts`** - Added Stripe routes
   - POST `/api/stripe/create-payment-intent`
   - POST `/api/stripe/confirm-payment`
   - GET `/api/stripe/payment-intent/:id`
   - POST `/api/stripe/webhook`

3. **`babylon-web/src/lib/stripe-api.ts`** - Updated to call backend
   - Changed from Supabase Edge Functions to direct HTTP calls
   - Now calls `http://localhost:5000/api/stripe/create-payment-intent`

4. **`babylon-app/.env`** - Added Stripe configuration

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Get your **Test Keys** (for development):
   - **Publishable Key**: starts with `pk_test_...`
   - **Secret Key**: starts with `sk_test_...`

### 2. Configure Environment Variables

Update `babylon-app/.env`:

```env
# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

⚠️ **Replace the placeholder values with your actual Stripe keys!**

### 3. Start the Backend Server

```bash
cd babylon-app
npm run dev:backend
```

The server will start on `http://localhost:5000`

### 4. Start the Frontend

In a separate terminal:

```bash
cd babylon-web
npm run dev
```

The frontend will start on `http://localhost:5173`

### 5. Test Payment Flow

1. Open your web app at `http://localhost:5173`
2. Add items to cart
3. Click checkout
4. Select "Pay with Card"
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

## API Endpoints

### Create Payment Intent
```http
POST http://localhost:5000/api/stripe/create-payment-intent
Content-Type: application/json

{
  "amount": 25.50,
  "currency": "eur",
  "paymentMethodTypes": ["card"],
  "metadata": {
    "orderId": "12345"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Get Payment Status
```http
GET http://localhost:5000/api/stripe/payment-intent/pi_xxx
```

**Response:**
```json
{
  "id": "pi_xxx",
  "status": "succeeded",
  "amount": 25.50,
  "currency": "eur"
}
```

## Stripe Test Cards

| Card Number         | Description              |
|---------------------|--------------------------|
| 4242 4242 4242 4242 | Successful payment       |
| 4000 0000 0000 9995 | Declined (insufficient)  |
| 4000 0000 0000 0002 | Declined (generic)       |
| 4000 0025 0000 3155 | Requires authentication  |

See more: https://stripe.com/docs/testing

## Webhook Setup (Optional - for Production)

When deploying to production, set up webhooks to receive payment confirmations:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

## CORS Configuration

The backend is already configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:5174`
- `https://babylon-admin.fly.dev`
- Any localhost port

No additional CORS configuration needed!

## Advantages Over Edge Functions

✅ **No CORS Issues** - Backend controls CORS completely  
✅ **Better Debugging** - Full Node.js debugging tools  
✅ **More Control** - Direct access to Stripe SDK  
✅ **Faster Development** - No deployment needed for changes  
✅ **Better Error Handling** - Full Express error handling  
✅ **Database Integration** - Easy to update orders after payment  

## Next Steps

1. **Add to your .env file**: Replace Stripe placeholder keys
2. **Test locally**: Run both backend and frontend
3. **Update order status**: Modify `handleWebhook()` to update orders in database
4. **Production deployment**: 
   - Set live Stripe keys in production environment
   - Configure webhook endpoint
   - Update `VITE_API_URL` in production

## Troubleshooting

### Payment Intent Creation Fails

Check:
1. ✅ Backend server is running (`npm run dev:backend`)
2. ✅ `STRIPE_SECRET_KEY` is set in `.env`
3. ✅ Secret key starts with `sk_test_` or `sk_live_`

### CORS Errors

Check:
1. ✅ Backend is running on port 5000
2. ✅ Frontend API URL points to `http://localhost:5000`
3. ✅ CORS configuration in `server/index.ts` includes your origin

### Webhook Signature Verification Fails

Check:
1. ✅ `STRIPE_WEBHOOK_SECRET` is set correctly
2. ✅ Raw body is being parsed (see route: `express.raw()`)
3. ✅ Webhook endpoint matches what's in Stripe dashboard

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Set `STRIPE_SECRET_KEY` in production environment
- [ ] Set `STRIPE_WEBHOOK_SECRET` from Stripe dashboard
- [ ] Update `VITE_API_URL` to production backend URL
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Test payment flow with real card
- [ ] Implement order status updates in webhook handler
- [ ] Add proper error logging and monitoring
- [ ] Set up Stripe alerts for failed payments

## Support

For Stripe documentation:
- API Reference: https://stripe.com/docs/api
- Payment Intents Guide: https://stripe.com/docs/payments/payment-intents
- Testing: https://stripe.com/docs/testing

For issues with this integration, check:
1. Backend logs in terminal running `npm run dev:backend`
2. Frontend console in browser DevTools
3. Network tab in browser DevTools
