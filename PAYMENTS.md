# Payment & Escrow System Guide

Complete guide for implementing secure payments, escrow, and Stripe verification in Source Impact.

---

## Table of Contents

1. [Overview](#overview)
2. [Stripe Setup](#stripe-setup)
3. [Escrow Workflow](#escrow-workflow)
4. [Verification System](#verification-system)
5. [Commission Routing](#commission-routing)
6. [Implementation Guide](#implementation-guide)

---

## Overview

### Payment Architecture

Source Impact uses a secure escrow system powered by Stripe to handle payments between sponsors and influencers, with automatic commission routing to agents.

**Key Components:**
- **Stripe Connect** - Connected accounts for payouts
- **Payment Intents** - Hold funds in escrow
- **Transfers** - Release funds to influencers
- **Webhooks** - Real-time payment status updates

### Payment Flow

```
1. Application Approved
   ↓
2. Sponsor Locks Funds (Stripe Payment Intent)
   ↓
3. Work Completed & Submitted
   ↓
4. Sponsor Releases Payment (Stripe Transfer)
   ↓
5. Commission Routed to Agents (if applicable)
```

### Escrow States

- `pending_payment` - Awaiting payment
- `payment_processing` - Processing payment
- `locked` - Funds in escrow
- `work_in_progress` - Influencer working
- `work_submitted` - Work submitted for review
- `under_review` - Sponsor reviewing
- `approved` - Work approved
- `releasing` - Releasing payment
- `released` - Payment complete
- `refunding` - Processing refund
- `refunded` - Refund complete
- `disputed` - Payment disputed

---

## Stripe Setup

### Step 1: Create Stripe Account

1. Sign up at https://dashboard.stripe.com/register
2. Enable **Stripe Connect** in Settings → Connect
3. Get API keys from Developers → API keys

### Step 2: Environment Variables

Add to `.env.local`:

```env
# Stripe API Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Connect
STRIPE_CONNECT_ACCOUNT_ID=acct_...

# Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 3: Required Stripe Products

Enable these in your Stripe account:
- ✅ **Stripe Connect** (for marketplace)
- ✅ **Payment Intents API** (for escrow)
- ✅ **Transfers** (for payouts)
- ✅ **Webhooks** (for event notifications)

### Step 4: Webhook Configuration

Set up webhook endpoint in Stripe Dashboard:

```
POST https://your-api.com/webhooks/stripe
```

**Events to subscribe to:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.paid`
- `charge.refunded`
- `account.updated`

---

## Escrow Workflow

### Lock Funds in Escrow

When sponsor approves application and locks funds:

```typescript
import { lockFundsInEscrow } from '@/utils/escrow-workflow';

await lockFundsInEscrow(
  gig,
  application,
  amount,
  currency,
  async (notification) => {
    await addNotification(notification);
  }
);
```

**What Happens:**

1. **Validate Balance** - Check sponsor has funds
2. **Create Payment Intent** - Stripe charges sponsor
3. **Create Escrow Job** - Record in database (status: `locked`)
4. **Update Balances** - Move to escrow balance
5. **Log Transaction** - Create transaction record
6. **Send Notifications** - Notify all parties

**Stripe API Call:**

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // Convert to cents
  currency: currency,
  payment_method_types: ['card'],
  capture_method: 'manual', // Hold funds
  metadata: {
    gigId: gig.id,
    applicationId: application.id,
    sponsorId: gig.sponsorId,
    influencerId: application.influencerId,
  },
});
```

### Release Funds to Influencer

When work is completed and approved:

```typescript
import { releaseFunds } from '@/utils/escrow-workflow';

await releaseFunds(
  escrowJobId,
  (agentId, commission) => {
    console.log(`Commission to agent: ${commission}`);
  },
  async (notification) => {
    await addNotification(notification);
  }
);
```

**What Happens:**

1. **Update Status** - Set to `releasing`
2. **Calculate Amounts** - Platform fee (10%) + net (90%)
3. **Create Transfer** - Transfer to influencer's Stripe account
4. **Update Balances** - Remove from escrow, add to influencer
5. **Route Commissions** - Pay agents if applicable
6. **Update Status** - Set to `released`
7. **Send Notifications** - Notify all parties

**Stripe API Call:**

```typescript
const transfer = await stripe.transfers.create({
  amount: netAmount * 100, // 90% of total
  currency: currency,
  destination: influencerStripeAccountId,
  transfer_group: escrowJob.id,
  metadata: {
    escrowJobId: escrowJob.id,
    gigId: escrowJob.gigId,
  },
});
```

### Refund to Sponsor

If deal is cancelled before completion:

```typescript
import { refundEscrow } from '@/utils/escrow-workflow';

await refundEscrow(escrowJobId, async (notification) => {
  await addNotification(notification);
});
```

**What Happens:**

1. **Update Status** - Set to `refunding`
2. **Process Refund** - Stripe refunds payment intent
3. **Update Balances** - Return to sponsor
4. **Update Status** - Set to `refunded`
5. **Send Notifications** - Notify both parties

**Stripe API Call:**

```typescript
const refund = await stripe.refunds.create({
  payment_intent: escrowJob.stripePaymentIntentId,
  reason: 'requested_by_customer',
  metadata: {
    escrowJobId: escrowJob.id,
  },
});
```

---

## Verification System

### Why Verification is Required

Before applying for deals, influencers must complete Stripe verification to:
- ✅ Enable secure payment processing
- ✅ Validate identity (KYC compliance)
- ✅ Prevent fraud
- ✅ Build trust between parties

### Verification Flow

```
1. User Signs Up
   ↓
2. Attempt to Apply for Deal
   ↓
3. Redirect to Stripe Verification
   ↓
4. Complete Stripe Onboarding
   ↓
5. Verification Complete
   ↓
6. Can Apply for Deals
```

### Verification States

- **not_started** - Not initiated
- **pending** - In progress
- **verified** - Complete, can receive payments
- **failed** - Needs retry

### User Data Structure

```typescript
interface User {
  stripeConnectedAccountId?: string;
  stripeOnboardingComplete?: boolean;
  stripeVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'failed';
  stripeVerifiedAt?: string;
}
```

### Create Connected Account

```typescript
import { StripeEscrowIntegration } from '@/utils/payment-integration';

const { accountId, onboardingUrl } = await StripeEscrowIntegration.createConnectedAccount(
  userId,
  userEmail,
  'individual' // or 'company'
);

// Redirect user to onboardingUrl
// They complete identity verification and bank setup
```

### Check Verification Status

```typescript
const status = await StripeEscrowIntegration.verifyConnectedAccountStatus(
  stripeConnectedAccountId
);

if (status.verified) {
  // User can receive payments
} else if (status.requiresAction) {
  // User needs to complete more steps
}
```

### Application Gate

Before allowing applications:

```typescript
if (user.stripeVerificationStatus !== 'verified') {
  Alert.alert(
    'Stripe Verification Required',
    'You need to verify your Stripe account before applying for deals.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify Now', onPress: () => router.push('/stripe-verification') }
    ]
  );
  return;
}
```

---

## Commission Routing

### Platform Fee Structure

**Base Fee:** 10% of deal amount (added on top)

**Example:** $5,000 deal
- Platform fee: $500 (10%)
- Influencer receives: $5,000
- Sponsor pays: $5,500
- Commission distribution: $500

### Distribution Logic

**Case 1: Both recruited by same agent**
```
Platform Fee: $500
Agent receives: $500 (100%)
Platform receives: $0
```

**Case 2: Different agents**
```
Platform Fee: $500
Agent A receives: $250 (50%)
Agent B receives: $250 (50%)
Platform receives: $0
```

**Case 3: Only one recruited**
```
Platform Fee: $500
Agent receives: $500 (100%)
Platform receives: $0
```

**Case 4: Neither recruited**
```
Platform Fee: $500
Platform receives: $500 (100%)
```

### Agent Tier Bonuses

Commission is increased based on agent tier:

| Tier | Deals Required | Bonus |
|------|----------------|-------|
| Bronze | 0-9 | Base (10%) |
| Silver | 10-24 | +2% |
| Gold | 25-49 | +5% |
| Platinum | 50+ | +8% |

**Example:**
```
Base Commission: $500
Agent Tier: Gold (+5%)
Final Commission: $500 + ($500 × 0.05) = $525
```

### Commission Payment

```typescript
// Update agent balance
await updateBalance(agentId, {
  availableBalance: currentBalance + commission,
  totalEarnings: totalEarnings + commission,
});

// Log transaction
await addTransaction({
  type: 'agent_commission',
  fromUser: 'escrow',
  toUser: agentId,
  amount: commission,
  attribution: { agentId, recruitedType, splitPercentage },
});
```

---

## Implementation Guide

### Integration Points

#### 1. Application Approval Flow

```typescript
// In gig-details.tsx or similar
const handleApprove = async (application) => {
  // Create deal
  const deal = await createDeal(gig, application);
  
  // Lock funds in escrow
  await lockFundsInEscrow(
    gig,
    application,
    agreedAmount,
    'usd',
    notificationCallback
  );
};
```

#### 2. Work Completion Flow

```typescript
// In deal-management.tsx
const handleReleaseFunds = async () => {
  await releaseFunds(
    escrowJobId,
    commissionCallback,
    notificationCallback
  );
};
```

#### 3. Deal Cancellation Flow

```typescript
// In deal-management.tsx
const handleCancel = async () => {
  await refundEscrow(
    escrowJobId,
    notificationCallback
  );
};
```

### Notification Examples

**Funds Locked (to Influencer):**
```
Title: "Funds Locked in Escrow! 🎉"
Message: "[Sponsor] has locked $[amount] in escrow for [Gig]. You can now start working!"
```

**Funds Released (to Influencer):**
```
Title: "Payment Released! 💰"
Message: "$[amount] has been released to your account!"
```

**Commission Earned (to Agent):**
```
Title: "Commission Earned! 💵"
Message: "You earned $[amount] commission from a deal!"
```

---

## Security Best Practices

### 1. Payment Intent Security
- Use `capture_method: 'manual'` to hold funds
- Validate amounts on server-side
- Check permissions before operations
- Log all payment operations

### 2. Webhook Security
- Verify webhook signatures
- Use HTTPS endpoints only
- Implement idempotency keys
- Handle duplicate events

### 3. Data Protection
- Never log full card numbers
- Store only Stripe IDs
- Encrypt payment metadata
- Implement rate limiting

### 4. Error Handling

```typescript
try {
  await lockFundsInEscrow(...);
} catch (error) {
  console.error('[Payment Error]', error);
  Alert.alert('Payment Failed', 'Please try again');
  await rollbackEscrowJob(escrowJobId);
}
```

---

## Testing

### Test Mode

Use Stripe test keys during development:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

### Test Scenarios

1. **Successful Payment Flow**
   - Lock funds → Work completed → Release payment
   - Verify notifications sent
   - Check commission routing

2. **Refund Flow**
   - Lock funds → Cancel deal → Process refund
   - Verify refund received
   - Check notification delivery

3. **Failed Payment**
   - Attempt with declined card
   - Verify error handling
   - Check user notification

4. **Webhook Processing**
   - Trigger webhook events
   - Verify status updates
   - Check idempotency

---

## Production Checklist

Before going live:

- [ ] Switch to live Stripe API keys
- [ ] Complete Stripe account verification
- [ ] Set up production webhook endpoints
- [ ] Configure webhook signing secrets
- [ ] Test with real bank accounts (small amounts)
- [ ] Implement monitoring and alerting
- [ ] Set up error tracking (Sentry)
- [ ] Review refund policies
- [ ] Verify tax compliance
- [ ] Test commission routing
- [ ] Document support procedures
- [ ] Train support team

---

## Monitoring & Logging

### Key Metrics

- Payment success rate
- Average escrow duration
- Refund rate
- Commission distribution
- Failed payment reasons
- Webhook processing time

### Logging Best Practices

```typescript
console.log('[Escrow] Step 1: Initiating payment');
console.log('[Stripe] Payment Intent created:', paymentIntentId);
console.log('[Commission] $X routed to agent Y');
console.log('[Notification] Sent to user:', userId);
```

---

## Troubleshooting

### Payment Declined
- Check card details
- Verify sufficient funds
- Contact Stripe support

### Webhook Not Received
- Check endpoint URL
- Verify webhook secret
- Check firewall settings

### Transfer Failed
- Verify connected account status
- Check account capabilities
- Ensure onboarding complete

### Commission Not Routed
- Verify referral records
- Check agent account status
- Review attribution logic

---

## Resources

- **Stripe Documentation**: https://stripe.com/docs/api
- **Stripe Connect**: https://stripe.com/docs/connect
- **Payment Intents**: https://stripe.com/docs/payments/payment-intents
- **Webhooks**: https://stripe.com/docs/webhooks
- **Testing**: https://stripe.com/docs/testing

---

## Support

- **Stripe Support**: https://support.stripe.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **App Support**: help@sourceimpact.com

---

**Last Updated**: 2025-12-04  
**Version**: 2.0 (Consolidated)
