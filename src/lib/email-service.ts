/**
 * Email Service for sending order confirmations and marketing emails
 * Uses Hostinger SMTP server
 *
 * Setup required:
 * 1. npm install nodemailer
 * 2. Set environment variables in .env:
 *    VITE_SMTP_HOST=smtp.hostinger.com
 *    VITE_SMTP_PORT=587
 *    VITE_SMTP_USER=no-reply@ravintolababylon.fi
 *    VITE_SMTP_PASS=your-password
 */

// Note: This is a client-side implementation template
// For production, you should create a backend API endpoint
// to handle email sending to avoid exposing SMTP credentials

export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    toppings?: string[];
  }>;
  subtotal: number;
  deliveryFee: number;
  smallOrderFee?: number;
  totalAmount: number;
  orderType: 'delivery' | 'pickup' | 'dine-in';
  deliveryAddress?: string;
  branchName?: string;
  branchPhone?: string;
  branchAddress?: string;
  specialInstructions?: string;
  paymentMethod: string;
}

export interface MarketingEmailData {
  recipients: string[];
  subject: string;
  htmlContent: string;
}

/**
 * Send marketing email to multiple recipients
 * Note: This should be called from a backend API endpoint in production
 */
export async function sendMarketingEmail(
  data: MarketingEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get API URL from environment or use default
    const API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

    console.log('📧 Marketing email would be sent to:', data.recipients.length, 'recipients');
    console.log('📧 Subject:', data.subject);

    // Call backend API
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.recipients,
        subject: data.subject,
        html: data.htmlContent,
        replyTo: 'info@ravintolababylon.fi'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Marketing emails sent successfully:', result.messageId);

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send marketing email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
