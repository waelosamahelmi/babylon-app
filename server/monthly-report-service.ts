import sgMail from '@sendgrid/mail';
import { db } from './db';
import { orders, orderItems, menuItems, restaurantSettings, restaurantConfig } from '@shared/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface MonthlyReportData {
  period: {
    month: string;
    year: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  orderTypes: {
    delivery: number;
    pickup: number;
  };
  paymentMethods: {
    cash: number;
    card: number;
    stripe: number;
  };
  paymentStatus: {
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  fees: {
    totalDeliveryFees: number;
    totalServiceFees: number;
    totalSmallOrderFees: number;
  };
}

export async function generateMonthlyReport(targetDate?: Date): Promise<MonthlyReportData | null> {
  try {
    // Default to previous month if no date specified
    const reportDate = targetDate || subMonths(new Date(), 1);
    const monthStart = startOfMonth(reportDate);
    const monthEnd = endOfMonth(reportDate);

    console.log(`📊 Generating monthly report for ${format(monthStart, 'MMMM yyyy')}`);

    // Get all orders for the month
    const monthlyOrders = await db.select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, monthStart),
          lt(orders.createdAt, monthEnd)
        )
      );

    if (monthlyOrders.length === 0) {
      console.log('📊 No orders found for this month');
      return null;
    }

    // Calculate summary statistics
    const completedOrders = monthlyOrders.filter(o => o.status === 'completed');
    const cancelledOrders = monthlyOrders.filter(o => o.status === 'cancelled');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Order types breakdown
    const deliveryOrders = monthlyOrders.filter(o => o.orderType === 'delivery').length;
    const pickupOrders = monthlyOrders.filter(o => o.orderType === 'pickup').length;

    // Payment methods breakdown
    const cashPayments = monthlyOrders.filter(o => o.paymentMethod === 'cash').length;
    const cardPayments = monthlyOrders.filter(o => o.paymentMethod === 'card').length;
    const stripePayments = monthlyOrders.filter(o => o.paymentMethod === 'stripe').length;

    // Payment status breakdown
    const paidOrders = monthlyOrders.filter(o => o.paymentStatus === 'paid').length;
    const pendingPayments = monthlyOrders.filter(o => o.paymentStatus === 'pending').length;
    const failedPayments = monthlyOrders.filter(o => o.paymentStatus === 'failed').length;
    const refundedPayments = monthlyOrders.filter(o => o.paymentStatus === 'refunded' || o.paymentStatus === 'partially_refunded').length;

    // Calculate fees
    const totalDeliveryFees = monthlyOrders.reduce((sum, o) => sum + parseFloat(o.deliveryFee || '0'), 0);
    const totalServiceFees = monthlyOrders.reduce((sum, o) => sum + parseFloat(o.serviceFee || '0'), 0);
    const totalSmallOrderFees = monthlyOrders.reduce((sum, o) => sum + parseFloat(o.smallOrderFee || '0'), 0);

    // Get top selling items
    const orderIds = monthlyOrders.map(o => o.id);
    const items = await db.select({
      menuItemId: orderItems.menuItemId,
      quantity: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.totalPrice})::numeric`,
      name: menuItems.name,
    })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(sql`${orderItems.orderId} = ANY(ARRAY[${sql.raw(orderIds.join(','))}])`)
      .groupBy(orderItems.menuItemId, menuItems.name)
      .orderBy(sql`sum(${orderItems.quantity}) DESC`)
      .limit(10);

    const topSellingItems = items.map(item => ({
      name: item.name || 'Unknown Item',
      quantity: item.quantity,
      revenue: parseFloat(String(item.revenue)) || 0,
    }));

    // Daily breakdown
    const dailyStats = new Map<string, { orders: number; revenue: number }>();
    monthlyOrders.forEach(order => {
      if (order.createdAt) {
        const dateKey = format(order.createdAt, 'yyyy-MM-dd');
        const existing = dailyStats.get(dateKey) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        if (order.status === 'completed') {
          existing.revenue += parseFloat(order.totalAmount);
        }
        dailyStats.set(dateKey, existing);
      }
    });

    const dailyBreakdown = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        orders: stats.orders,
        revenue: stats.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        month: format(monthStart, 'MMMM'),
        year: monthStart.getFullYear(),
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd'),
      },
      summary: {
        totalOrders: monthlyOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalRevenue,
        averageOrderValue,
      },
      orderTypes: {
        delivery: deliveryOrders,
        pickup: pickupOrders,
      },
      paymentMethods: {
        cash: cashPayments,
        card: cardPayments,
        stripe: stripePayments,
      },
      paymentStatus: {
        paid: paidOrders,
        pending: pendingPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      topSellingItems,
      dailyBreakdown,
      fees: {
        totalDeliveryFees,
        totalServiceFees,
        totalSmallOrderFees,
      },
    };
  } catch (error) {
    console.error('❌ Error generating monthly report:', error);
    throw error;
  }
}

function generateReportHtml(report: MonthlyReportData, restaurantName: string): string {
  const topItemsRows = report.topSellingItems.map((item, index) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.revenue.toFixed(2)}</td>
    </tr>
  `).join('');

  const dailyRows = report.dailyBreakdown.map(day => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${day.date}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${day.orders}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${day.revenue.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Report - ${report.period.month} ${report.period.year}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e53e3e; padding-bottom: 20px;">
          <h1 style="color: #e53e3e; margin: 0;">${restaurantName}</h1>
          <h2 style="color: #333; margin: 10px 0 0;">Monthly Report</h2>
          <p style="color: #666; font-size: 18px;">${report.period.month} ${report.period.year}</p>
          <p style="color: #999; font-size: 14px;">${report.period.startDate} to ${report.period.endDate}</p>
        </div>

        <!-- Summary Section -->
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #e53e3e; margin-top: 0;">📊 Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #333;">${report.summary.totalOrders}</div>
              <div style="color: #666;">Total Orders</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #22c55e;">€${report.summary.totalRevenue.toFixed(2)}</div>
              <div style="color: #666;">Total Revenue</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #333;">${report.summary.completedOrders}</div>
              <div style="color: #666;">Completed</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #333;">€${report.summary.averageOrderValue.toFixed(2)}</div>
              <div style="color: #666;">Avg Order Value</div>
            </div>
          </div>
        </div>

        <!-- Order Types -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #e53e3e;">🚚 Order Types</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Delivery Orders</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">${report.orderTypes.delivery}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Pickup Orders</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">${report.orderTypes.pickup}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Methods -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #e53e3e;">💳 Payment Methods</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Cash</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">${report.paymentMethods.cash}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Card (POS)</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">${report.paymentMethods.card}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Online (Stripe)</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">${report.paymentMethods.stripe}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Status -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #e53e3e;">📝 Payment Status</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Paid</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold; color: #22c55e;">${report.paymentStatus.paid}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Pending</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold; color: #f59e0b;">${report.paymentStatus.pending}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Failed</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold; color: #ef4444;">${report.paymentStatus.failed}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Refunded</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">${report.paymentStatus.refunded}</td>
            </tr>
          </table>
        </div>

        <!-- Fees Collected -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #e53e3e;">💰 Fees Collected</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Delivery Fees</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">€${report.fees.totalDeliveryFees.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Service Fees</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">€${report.fees.totalServiceFees.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eee;">Small Order Fees</td>
              <td style="padding: 10px; border: 1px solid #eee; text-align: right; font-weight: bold;">€${report.fees.totalSmallOrderFees.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Top Selling Items -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #e53e3e;">🏆 Top Selling Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f7fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e53e3e;">#</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e53e3e;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e53e3e;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e53e3e;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topItemsRows}
            </tbody>
          </table>
        </div>

        <!-- Daily Breakdown -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #e53e3e;">📅 Daily Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f7fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e53e3e;">Date</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e53e3e;">Orders</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e53e3e;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${dailyRows}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
          <p>This report was automatically generated on ${format(new Date(), 'PPpp')}</p>
          <p style="font-size: 12px;">Powered by PlateOS Restaurant Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendMonthlyReportEmail(targetDate?: Date): Promise<boolean> {
  try {
    // Get settings to find report email
    const settings = await db.select().from(restaurantSettings).limit(1);
    const config = await db.select().from(restaurantConfig).limit(1);

    const reportEmail = settings[0]?.monthlyReportEmail;
    const reportEnabled = settings[0]?.monthlyReportEnabled;
    const restaurantName = config[0]?.name || 'Restaurant';

    if (!reportEnabled) {
      console.log('📧 Monthly report is disabled in settings');
      return false;
    }

    if (!reportEmail) {
      console.log('📧 No monthly report email configured');
      return false;
    }

    // Generate the report
    const report = await generateMonthlyReport(targetDate);
    if (!report) {
      console.log('📧 No data to report');
      return false;
    }

    // Generate HTML
    const htmlContent = generateReportHtml(report, restaurantName);

    // Send email
    const msg = {
      to: reportEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'reports@ravintolababylon.fi',
      subject: `Monthly Report - ${report.period.month} ${report.period.year} - ${restaurantName}`,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Monthly report sent successfully to ${reportEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send monthly report email:', error);
    return false;
  }
}

// Function to manually trigger report for a specific month
export async function triggerManualReport(email: string, month?: number, year?: number): Promise<boolean> {
  try {
    const config = await db.select().from(restaurantConfig).limit(1);
    const restaurantName = config[0]?.name || 'Restaurant';

    // Calculate the target date
    let targetDate = new Date();
    if (month !== undefined && year !== undefined) {
      targetDate = new Date(year, month - 1, 1); // month is 1-indexed for user input
    }

    const report = await generateMonthlyReport(targetDate);
    if (!report) {
      console.log('📧 No data to report for the specified period');
      return false;
    }

    const htmlContent = generateReportHtml(report, restaurantName);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'reports@ravintolababylon.fi',
      subject: `Monthly Report - ${report.period.month} ${report.period.year} - ${restaurantName}`,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Manual monthly report sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send manual monthly report:', error);
    return false;
  }
}
