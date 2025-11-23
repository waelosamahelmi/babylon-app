import Stripe from 'stripe';
import type { Request, Response } from 'express';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface CreatePaymentIntentRequest {
  amount: number; // Total amount in euros (will be converted to cents)
  currency?: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a Stripe Payment Intent
 * This endpoint is called from the frontend to get a client secret for payment
 */
export async function createPaymentIntent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { 
      amount, 
      currency = 'eur', 
      paymentMethodTypes = ['card'], 
      metadata = {} 
    }: CreatePaymentIntentRequest = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not configured');
      res.status(500).json({ error: 'Payment service not configured' });
      return;
    }

    // Create payment intent parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert euros to cents
      currency,
      metadata,
    };

    // Add payment method types or use automatic payment methods
    if (paymentMethodTypes && paymentMethodTypes.length > 0) {
      paymentIntentParams.payment_method_types = paymentMethodTypes;
    } else {
      paymentIntentParams.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never',
      };
    }

    console.log(`💳 Creating payment intent for €${amount} (${amount * 100} cents)`);

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);

    // Return client secret to frontend
    const response: CreatePaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
}

/**
 * Confirm a payment (optional - Stripe usually auto-confirms)
 */
export async function confirmPayment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      res.status(400).json({ error: 'Payment intent ID is required' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      message: error.message 
    });
  }
}

/**
 * Retrieve payment intent status
 */
export async function getPaymentIntent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      res.status(400).json({ error: 'Payment intent ID is required' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert cents back to euros
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });
  } catch (error: any) {
    console.error('❌ Error retrieving payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve payment intent',
      message: error.message 
    });
  }
}

/**
 * Webhook handler for Stripe events
 */
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    console.log(`🔔 Stripe webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
        // TODO: Update order status in database
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${failedPayment.id}`);
        // TODO: Handle failed payment
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ 
      error: 'Webhook verification failed',
      message: error.message 
    });
  }
}

export { stripe };
