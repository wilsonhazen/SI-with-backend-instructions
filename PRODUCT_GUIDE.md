# Source Impact - Product Guide

Complete product documentation including features, user roles, and system overview.

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Features](#user-roles--features)
3. [Core Features](#core-features)
4. [Rewards System](#rewards-system)
5. [Design System](#design-system)
6. [User Flows](#user-flows)

---

## Overview

### What is Source Impact?

Source Impact is an **influencer marketing marketplace** mobile application that connects:
- **Influencers** - Content creators seeking brand deals
- **Sponsors** - Brands seeking influencer partnerships
- **Agents** - Talent managers earning commissions
- **Admins** - Platform administrators

### Platform Value Proposition

**For Influencers:**
- Access to verified brand deals
- Secure escrow payments
- Portfolio showcase
- Rewards for platform activity

**For Sponsors:**
- Direct access to qualified influencers
- Transparent pricing
- Escrow-protected payments
- Campaign management tools

**For Agents:**
- Automated commission tracking (10% of deals)
- Contact management tools
- Referral system with rewards
- Performance analytics

### Tech Stack

- **Platform**: React Native 0.79.1 + Expo SDK 54
- **Language**: TypeScript 5.8.3 (strict mode)
- **Routing**: Expo Router (file-based)
- **State**: React Query + Context API
- **Backend**: Hono + tRPC + Supabase
- **Payments**: Stripe Connect
- **AI**: Built-in SDK (GPT-4, DALL-E 3, Gemini, Whisper)

---

## User Roles & Features

### 1. Influencer

**Primary Functions:**
- Browse and apply to gigs
- Showcase portfolio and metrics
- Manage active deals
- Track earnings
- Message sponsors
- Link/verify social accounts
- Set payment preferences

**Profile Data:**
- Bio, location, influencer type
- Social media links (Instagram, TikTok, YouTube, Twitter)
- Follower counts and engagement rates
- Portfolio with metrics
- Rate per post
- Categories/niches
- Payment preferences (fiat/crypto)

**Metrics Displayed:**
- Total followers across platforms
- Average engagement rate
- Completed deals
- Total earnings
- Success rate

### 2. Sponsor (Brand)

**Primary Functions:**
- Post gigs with budgets
- Browse and match with influencers
- Review applications
- Manage campaigns
- Release escrow payments
- Track ROI
- Message influencers

**Profile Data:**
- Company name and industry
- Location and website
- Company description
- Budget ranges
- Past campaigns

**Metrics Displayed:**
- Active campaigns
- Total deals completed
- Average deal value
- Influencer reach

### 3. Agent

**Primary Functions:**
- Generate referral codes
- Import contacts (phone, CSV, Gmail)
- Send invites via SMS/email
- Track recruited users
- Monitor commission earnings (10%)
- View recruit performance
- Manage subscription

**Profile Data:**
- Bio and specialties
- Referral code
- Total earnings
- List of recruits
- Subscription status
- Performance tier

**Commission Structure:**
- 10% of all deals involving recruits
- Automatic calculation
- Real-time tracking
- Tier-based bonuses

**Tiers:**
- Bronze: 0-9 deals (10% commission)
- Silver: 10-24 deals (12% commission)
- Gold: 25-49 deals (15% commission)
- Platinum: 50+ deals (18% commission)

### 4. Admin

**Primary Functions:**
- Platform oversight
- User management
- Reward system configuration
- Deal moderation
- Financial management
- Analytics and reporting

**Access:**
- All user data
- Transaction history
- Reward triggers
- System configuration

---

## Core Features

### 1. Onboarding & Authentication

✅ **Role Selection Screen**
- Beautiful gradient cards for each role
- Clear role descriptions
- Visual role indicators

✅ **Profile Setup**
- Role-specific fields
- Social media linking
- Portfolio upload (influencers)
- Company info (sponsors)

✅ **Persistent Authentication**
- AsyncStorage for session
- Automatic routing based on auth state
- Secure token storage

### 2. Discovery Feed (Tinder-Style)

✅ **Swipeable Cards**
- Smooth PanResponder animations
- Card rotations on swipe
- Match notifications

✅ **Profile Cards**
- Stats and metrics
- Category badges
- Engagement rates
- Rate per post display

✅ **Match Creation**
- Right swipe creates match
- Both parties notified
- Conversation initiated

### 3. Gigs Management

**For Sponsors:**
- Create gigs with budgets
- Set requirements
- Define deliverables
- Review applicants
- Approve/reject applications

**For Influencers:**
- Browse available gigs
- Filter by category/budget
- Apply with custom pitch
- Track application status

**Gig Data:**
- Title and description
- Budget range
- Categories
- Required influencer types
- Location (if applicable)
- Timeline/deadline
- Deliverables

### 4. Deals Management

✅ **Tabbed Interface**
- All, Pending, Active, Completed tabs
- Status filtering
- Quick access to deal details

✅ **Deal Cards**
- Shows all parties (sponsor, influencer, agent)
- Status badges with colors
- Commission display for agents
- Date tracking
- Amount display

✅ **Deal States:**
- Pending - Application approved, awaiting escrow
- Active - Funds in escrow, work in progress
- Completed - Payment released
- Cancelled - Deal cancelled/refunded

✅ **Earnings Dashboard**
- Gradient cards showing stats
- Total earnings
- Active deals
- Completed deals
- Average deal value (influencers)
- Commission tracking (agents)

### 5. Messaging System

✅ **Conversation List**
- Avatar display
- Unread badges
- Last message preview
- Relative timestamps
- Deal association indicators

✅ **Chat Interface**
- Real-time messaging
- Read receipts
- Deal context
- Message history

### 6. Profile & Settings

✅ **Role-Specific Profiles**
- Gradient avatars based on role
- Influencer stats (followers, engagement, rate)
- Agent referral code with copy function
- Agent earnings and recruits
- Subscription upgrade prompts

✅ **Menu Items:**
- Earnings/Analytics
- Payment Methods
- Stripe Verification
- Settings
- Help & Support
- Admin Panel (admins only)
- Logout

### 7. Search & Filtering

✅ **Gig Search:**
- Category filters
- Budget range
- Location
- Influencer type
- Keywords

✅ **User Search:**
- Find influencers
- Filter by niche
- Sort by engagement
- View profiles

### 8. Payment System

✅ **Escrow Workflow:**
- Lock funds on approval
- Hold during work
- Release on completion
- Refund if cancelled

✅ **Payment Methods:**
- Stripe (primary)
- Crypto via Coinbase (optional)

✅ **Stripe Verification:**
- Required before applying
- Identity verification
- Bank account setup
- Verification status tracking

### 9. Notifications

✅ **Notification Types:**
- Application status updates
- New messages
- Payment notifications
- Reward earned
- Deal milestones

✅ **Notification Channels:**
- In-app notifications
- Push notifications
- Email notifications (future)

### 10. AI Features

✅ **Available AI Tools:**
- Profile optimizer
- Content idea generator
- Contract generator
- Deal success predictor
- Analytics insights
- AI assistant chatbot

✅ **AI Models:**
- GPT-4 for text generation
- DALL-E 3 for image generation
- Gemini 2.5 for image editing
- Whisper for speech-to-text

---

## Rewards System

### Overview

All rewards paid in **IMPACT tokens** (1:1 parity with USD).

### Getting Started Rewards ($15-$45)

| Reward | Amount | Action |
|--------|--------|--------|
| Account Setup | 15 IMPACT | Complete profile |
| Crypto Wallet Connected | 15 IMPACT | Add first wallet |
| First Post | 15 IMPACT | Post on feed |
| First Application | 15 IMPACT | Apply to gig |
| First Review | 15 IMPACT | Leave review |
| Profile Verification | 30 IMPACT | Verify profile |
| Single Referral | 30 IMPACT | Invite friend |
| First Gig Posted | 24 IMPACT | Post first gig |
| 7-Day Login Streak | 21 IMPACT | Log in 7 days |
| First Deal | 45 IMPACT | Complete first deal |

### Milestone Rewards

**Deal Milestones:**
- 5 Deals: 75 IMPACT
- 10 Deals: 150 IMPACT
- 25 Deals: 300 IMPACT
- 50 Deals: 600 IMPACT
- 100 Deals: 1,500 IMPACT

**Referral Milestones:**
- 5 Referrals: 120 IMPACT
- 10 Referrals: 240 IMPACT
- 25 Referrals: 750 IMPACT

**Earnings Milestones:**
- First $100: 30 IMPACT
- $500 Earned: 90 IMPACT
- $1,000 Earned: 225 IMPACT
- $5,000 Earned: 600 IMPACT
- $10,000 Earned: 1,500 IMPACT

### Total Rewards Available

**Maximum Achievable:** 10,785+ IMPACT ($10,785+)
**Number of Rewards:** 30+
**Number of Badges:** 23

### Badge System

✅ **Achievement Badges:**
- Newcomer Badge
- Verified Badge
- Consistent Badge
- First Deal Badge
- Rising Star Badge
- Pro Badge
- Expert Badge
- Master Badge
- Legend Badge
- Connector Badge
- Influencer Badge
- Ambassador Badge

---

## Design System

### Color Palette

```typescript
{
  primary: '#6366F1',      // Indigo - Main brand
  secondary: '#3B82F6',    // Blue - Accents
  success: '#10B981',      // Green - Completed
  warning: '#F59E0B',      // Amber - Earnings
  danger: '#EF4444',       // Red - Errors
  dark: '#0F172A',         // Slate - Background
  darkCard: '#1E293B',     // Card backgrounds
  darkBorder: '#334155',   // Borders
  text: '#F1F5F9',         // Primary text
  textSecondary: '#94A3B8',// Secondary text
  textMuted: '#64748B',    // Muted text
}
```

### Typography

- **Headers**: 28-36px, Bold (700)
- **Titles**: 18-24px, Bold (700)
- **Body**: 14-16px, Regular (400)
- **Labels**: 12-14px, Semi-bold (600)

### Components

✅ **Gradient Buttons** - Primary to Secondary gradient
✅ **Glass Cards** - Dark card with subtle transparency
✅ **Status Badges** - Color-coded with icons
✅ **Animated Cards** - Smooth swipe interactions

---

## User Flows

### Influencer Journey

```
1. Sign Up → Select Influencer Role
   ↓
2. Complete Profile → Add social links, bio, rate
   ↓
3. Link Social Accounts → Verify Instagram/TikTok
   ↓
4. Complete Stripe Verification → Required for payments
   ↓
5. Browse Gigs → Swipe or search
   ↓
6. Apply to Gig → Submit with pitch
   ↓
7. Wait for Approval → Notification sent
   ↓
8. Work on Project → After escrow locked
   ↓
9. Submit Deliverables → Upload work
   ↓
10. Receive Payment → Funds released
```

### Sponsor Journey

```
1. Sign Up → Select Sponsor Role
   ↓
2. Complete Profile → Add company info
   ↓
3. Post Gig → Set budget, requirements
   ↓
4. Review Applications → View influencer profiles
   ↓
5. Approve Application → Select best fit
   ↓
6. Lock Funds in Escrow → Secure payment
   ↓
7. Review Deliverables → Check work quality
   ↓
8. Release Payment → Complete deal
```

### Agent Journey

```
1. Sign Up → Select Agent Role
   ↓
2. Complete Profile → Add bio, specialties
   ↓
3. Get Referral Code → Unique code generated
   ↓
4. Import Contacts → Phone, CSV, Gmail
   ↓
5. Send Invites → SMS/Email to contacts
   ↓
6. Track Recruits → Monitor sign-ups
   ↓
7. Earn Commissions → 10% on recruit deals
   ↓
8. Upgrade to Pro → $80/month for premium features
```

---

## Data Architecture

### Core Data Models

**User**
- id, email, password, role
- profile_image_url, bio
- created_at, updated_at
- stripe_connected_account_id
- stripe_verification_status

**Gig**
- id, sponsor_id, title, description
- budget_min, budget_max
- categories, requirements
- status, created_at

**Application**
- id, gig_id, influencer_id
- proposed_rate, message
- status (pending/approved/rejected)

**Deal**
- id, gig_id, sponsor_id, influencer_id
- agreed_rate, status
- escrow_job_id, deliverables
- created_at, completed_at

**EscrowJob**
- id, deal_id, amount
- platform_fee, influencer_amount
- state, stripe_payment_intent_id
- locked_at, released_at

---

## Monetization Strategy

### Revenue Streams

1. **Transaction Fees** (Primary)
   - 10% platform fee on all deals
   - Added on top (sponsor pays extra)
   - Influencer receives full agreed amount

2. **Subscriptions** (Secondary)
   - Free: Limited applications (5/month)
   - Basic: $19/month - Unlimited applications
   - Pro: $49/month - Featured placement, AI matching
   - Enterprise: $199/month - API access, white-label

3. **One-Time Purchases**
   - Profile Boost: $29/week
   - Gig Boost: $19/week
   - AI Profile Optimizer: $9

### Revenue Projections

**Year 1 Targets:**
- Conservative: $262K
- Moderate: $1.4M
- Aggressive: $6.6M

---

## Status

**Current Status**: ✅ Frontend Complete | ⏳ Backend Needed

**Completed:**
- ✅ All UI screens
- ✅ Role-based flows
- ✅ Mock data structure
- ✅ Payment UI components
- ✅ Messaging interface
- ✅ Profile management
- ✅ Search and filtering
- ✅ Swipe interface
- ✅ AI integration
- ✅ Rewards system UI

**Needed:**
- ⏳ Backend API implementation
- ⏳ Database setup
- ⏳ Stripe integration
- ⏳ Real-time messaging
- ⏳ Push notifications

---

## Getting Started

### For Users

1. Download the app (iOS/Android)
2. Create an account and select role
3. Complete profile setup
4. Start browsing/posting gigs
5. Connect with brands/influencers

### For Developers

See [BACKEND.md](./BACKEND.md) for complete backend setup guide.

---

## Resources

- **Backend Guide**: [BACKEND.md](./BACKEND.md)
- **AI Features**: [AI_FEATURES.md](./AI_FEATURES.md)
- **Payments**: [PAYMENTS.md](./PAYMENTS.md)
- **README**: [README.md](./README.md)

---

**Last Updated**: 2025-12-04  
**Version**: 2.0 (Consolidated)
