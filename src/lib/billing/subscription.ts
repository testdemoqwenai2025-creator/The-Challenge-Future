// NEXUS Subscription & Billing System
// Stripe integration for Pro/Enterprise plans with usage-based billing
// Supports: One-time payments, subscriptions, usage-based billing, team seats

import { NextResponse } from 'next/server';

// ==================== TYPES ====================

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    apiCallsPerMonth: number;
    teamSeats: number;
    rpaSubmissionsPerMonth: number;
    aiGenerationsPerMonth: number;
    gazetteSources: number;
    collaborationRooms: number;
    storageGB: number;
  };
  stripePriceId?: string; // Set when Stripe is configured
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  quantity: number; // Number of seats
  metadata?: Record<string, string>;
}

export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  metric: 'api_calls' | 'rpa_submissions' | 'ai_generations' | 'team_seats' | 'storage';
  quantity: number;
  timestamp: Date;
  description?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  paidAt?: Date;
  url?: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
  planId: string;
  mode: 'subscription' | 'payment';
}

// ==================== PLAN DEFINITIONS ====================

export const PLANS: Record<string, Plan> = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Perfect for individuals exploring funding opportunities',
    price: 0,
    currency: 'GBP',
    interval: 'month',
    features: [
      'Basic company search (10/day)',
      'Gazette monitoring (UK only)',
      'Email digest (weekly)',
      'Community forum access',
      '1 saved search',
      'Basic AI summaries',
    ],
    limits: {
      apiCallsPerMonth: 100,
      teamSeats: 1,
      rpaSubmissionsPerMonth: 0,
      aiGenerationsPerMonth: 20,
      gazetteSources: 1,
      collaborationRooms: 0,
      storageGB: 1,
    },
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For serious founders and researchers actively seeking funding',
    price: 49,
    currency: 'GBP',
    interval: 'month',
    features: [
      'Everything in Explorer, plus:',
      'Unlimited company searches',
      'All gazette sources (UK + EU)',
      'AI grant writing assistant',
      'Smart funding matcher',
      'Real-time alerts',
      '5 saved searches',
      'Priority support',
      'Export to PDF/Excel',
      'API access (1000 calls/month)',
      '3 collaboration rooms',
      '5 RPA submissions/month',
    ],
    limits: {
      apiCallsPerMonth: 1000,
      teamSeats: 3,
      rpaSubmissionsPerMonth: 5,
      aiGenerationsPerMonth: 200,
      gazetteSources: 10,
      collaborationRooms: 3,
      storageGB: 10,
    },
    // stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations needing advanced features and dedicated support',
    price: 199,
    currency: 'GBP',
    interval: 'month',
    features: [
      'Everything in Pro, plus:',
      'Unlimited everything',
      'Custom gazette sources',
      'White-label reports',
      'SSO/SAML authentication',
      'Dedicated account manager',
      'SLA guarantee (99.9%)',
      'Custom integrations',
      'On-premise option',
      'Unlimited team seats',
      'Advanced analytics dashboard',
      'Concierge RPA service',
    ],
    limits: {
      apiCallsPerMonth: Infinity,
      teamSeats: Infinity,
      rpaSubmissionsPerMonth: Infinity,
      aiGenerationsPerMonth: Infinity,
      gazetteSources: Infinity,
      collaborationRooms: Infinity,
      storageGB: Infinity,
    },
    // stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },

  team_addon: {
    id: 'team_addon',
    name: 'Additional Team Seat',
    description: 'Add extra team members to your plan',
    price: 15,
    currency: 'GBP',
    interval: 'month',
    features: [
      '1 additional team member',
      'Full access to plan features',
      'Own login credentials',
    ],
    limits: {
      apiCallsPerMonth: 250,
      teamSeats: 1,
      rpaSubmissionsPerMonth: 2,
      aiGenerationsPerMonth: 50,
      gazetteSources: 0,
      collaborationRooms: 1,
      storageGB: 2,
    },
    // stripePriceId: process.env.STRIPE_TEAM_ADDON_PRICE_ID,
  },
};

// ==================== BILLING SERVICE ====================

class BillingService {
  private stripeEnabled: boolean;

  constructor() {
    this.stripeEnabled = !!process.env.STRIPE_SECRET_KEY && 
                         !process.env.STRIPE_SECRET_KEY.includes('your-');
    
    if (this.stripeEnabled) {
      console.log('💳 Stripe billing enabled');
    } else {
      console.log('⚠️ Stripe not configured - using mock billing mode');
    }
  }

  /**
   * Create a checkout session for plan purchase
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    quantity: number = 1,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    const plan = PLANS[planId];
    
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    if (!this.stripeEnabled) {
      // Mock checkout session for development
      return this.createMockCheckoutSession(userId, planId, quantity);
    }

    try {
      const Stripe = await import('stripe');
      const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY!);

      const session = await stripe.checkout.sessions.create({
        mode: plan.price > 0 ? 'subscription' : 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId || this.getMockPriceId(planId),
            quantity,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId,
          quantity: quantity.toString(),
        },
        subscription_data: plan.price > 0 ? {
          trial_period_days: planId === 'pro' ? 14 : 7,
          metadata: { userId, planId },
        } : undefined,
        customer_creation: true,
      });

      return {
        sessionId: session.id,
        url: session.url!,
        planId,
        mode: plan.price > 0 ? 'subscription' : 'payment',
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhookEvent(
    payload: string,
    signature: string
  ): Promise<{ event: any; handled: boolean }> {
    if (!this.stripeEnabled) {
      console.log('⚠️ Webhook received but Stripe not enabled - would mock handle');
      return { event: null, handled: false };
    }

    const Stripe = await import('stripe');
    const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY!);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed`);
    }

    let handled = false;

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        handled = true;
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        handled = true;
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(event.data.object);
        handled = true;
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        handled = true;
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        handled = true;
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { event, handled };
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    if (!this.stripeEnabled) {
      return this.getMockSubscription(userId);
    }

    // In production, query database for user's subscription
    // For now, return null (no active subscription)
    return null;
  }

  /**
   * Check if user has access to a feature
   */
  async checkFeatureAccess(
    userId: string,
    feature: keyof Plan['limits']
  ): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
    const subscription = await this.getUserSubscription(userId);
    const planId = subscription?.planId || 'explorer';
    const plan = PLANS[planId];
    const limit = plan.limits[feature];

    // Get current usage (in production, query usage records)
    const used = await this.getCurrentUsage(userId, feature);

    return {
      allowed: used < limit,
      used,
      limit: limit === Infinity ? -1 : limit,
      remaining: limit === Infinity ? -1 : Math.max(0, limit - used),
    };
  }

  /**
   * Record usage of a metered feature
   */
  async recordUsage(
    userId: string,
    metric: UsageRecord['metric'],
    quantity: number = 1,
    description?: string
  ): Promise<void> {
    if (!this.stripeEnabled) {
      console.log(`📊 Usage recorded (mock): ${userId} ${metric} +${quantity}`);
      return;
    }

    // In production, insert into database and report to Stripe
    // For now, just log
    console.log(`📊 Recording usage: ${userId} ${metric} +${quantity} ${description || ''}`);
  }

  /**
   * Create portal session for managing subscription
   */
  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<string> {
    if (!this.stripeEnabled) {
      return '/settings/billing?mock=true';
    }

    const Stripe = await import('stripe');
    const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY!);

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const session = await stripe.bPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Calculate prorated amount for plan changes
   */
  calculateProratedAmount(
    fromPlan: Plan,
    toPlan: Plan,
    daysRemaining: number
  ): number {
    const daysInMonth = 30;
    const dailyRateFrom = fromPlan.price / daysInMonth;
    const dailyRateTo = toPlan.price / daysInMonth;

    const credit = dailyRateFrom * daysRemaining;
    const charge = dailyRateTo * daysRemaining;

    return Math.max(0, charge - credit);
  }

  // ==================== USAGE TRACKING ====================

  private async getCurrentUsage(
    userId: string,
    metric: UsageRecord['metric']
  ): Promise<number> {
    // In production, query sum of usage records for current period
    // For now, return random-ish value for demo
    switch (metric) {
      case 'api_calls':
        return Math.floor(Math.random() * 500);
      case 'ai_generations':
        return Math.floor(Math.random() * 150);
      case 'rpa_submissions':
        return Math.floor(Math.random() * 5);
      case 'team_seats':
        return 1; // Would come from actual team count
      case 'storage':
        return Math.floor(Math.random() * 5); // GB
      default:
        return 0;
    }
  }

  // ==================== STRIPE HELPERS ====================

  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    // In production, look up/create customer in database
    // Return mock customer ID for now
    return `cus_mock_${userId}`;
  }

  private async handleCheckoutComplete(session: any): Promise<void> {
    const { userId, planId, quantity } = session.metadata;
    
    console.log(`✅ Checkout completed: ${userId} → ${planId} (${quantity} seat(s))`);
    
    // In production:
    // 1. Create/update subscription in database
    // 2. Send welcome email
    // 3. Update user's plan in auth session
    // 4. Grant access to features
  }

  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    console.log(`📝 Subscription updated: ${subscription.id} status=${subscription.status}`);
    
    // Update subscription in database
  }

  private async handleSubscriptionCancellation(subscription: any): Promise<void> {
    console.log(`❌ Subscription cancelled: ${subscription.id}`);
    
    // Mark subscription as cancelled
    // Keep access until period end
    // Send cancellation survey email
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    console.log(`💰 Invoice paid: ${invoice.id} amount=${invoice.amount_paid}`);
    
    // Mark invoice as paid
    // Send receipt email
    // Extend access if needed
  }

  private async handlePaymentFailure(invoice: any): Promise<void> {
    console.log(`⚠️ Payment failed: ${invoice.id}`);
    
    // Send payment failure notification
    // Attempt retry according to Stripe settings
    // Suspend account after N failures
  }

  // ==================== MOCK MODE HELPERS ====================

  private createMockCheckoutSession(
    userId: string,
    planId: string,
    quantity: number
  ): CheckoutSession {
    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      sessionId,
      url: `/api/billing/mock-success?session_id=${sessionId}&plan=${planId}`,
      planId,
      mode: PLANS[planId].price > 0 ? 'subscription' : 'payment',
    };
  }

  private getMockSubscription(userId: string): Subscription | null {
    // Return mock subscription for testing
    return {
      id: 'sub_mock_123',
      userId,
      planId: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      quantity: 1,
    };
  }

  private getMockPriceId(planId: string): string {
    return `price_mock_${planId}`;
  }

  /**
   * Get available plans (filtered by context)
   */
  getAvailablePlans(options?: { 
    includeFree?: boolean; 
    includeAddons?: boolean;
  }): Plan[] {
    const plans = Object.values(PLANS).filter(plan => {
      if (!options?.includeFree && plan.price === 0 && plan.id !== 'explorer') return false;
      if (!options?.includeAddons && plan.id === 'team_addon') return false;
      return true;
    });

    return plans;
  }

  /**
   * Calculate annual savings for yearly billing
   */
  calculateAnnualSavings(planId: string): { monthlyTotal: number; yearlyTotal: number; savings: number; percentage: number } {
    const plan = PLANS[planId];
    const monthlyTotal = plan.price * 12;
    const yearlyTotal = plan.price * 12 * 0.8; // 20% discount for yearly
    const savings = monthlyTotal - yearlyTotal;
    const percentage = Math.round((savings / monthlyTotal) * 100);

    return { monthlyTotal, yearlyTotal, savings, percentage };
  }
}

// Export singleton instance
export const billingService = new BillingService();

// ==================== API ROUTE HANDLERS ====================

export async function POST_createCheckoutSession(request: Request) {
  try {
    const body = await request.json();
    const { userId, planId, quantity, successUrl, cancelUrl } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await billingService.createCheckoutSession(
      userId,
      planId,
      quantity || 1,
      successUrl || `${process.env.APP_URL}/billing/success`,
      cancelUrl || `${process.env.APP_URL}/billing/cancelled`
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET_userSubscription(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const subscription = await billingService.getUserSubscription(userId);

  return NextResponse.json({ subscription });
}

export async function GET_featureAccess(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const feature = searchParams.get('feature') as keyof Plan['limits'];

  if (!userId || !feature) {
    return NextResponse.json({ error: 'User ID and feature required' }, { status: 400 });
  }

  const access = await billingService.checkFeatureAccess(userId, feature);

  return NextResponse.json(access);
}
