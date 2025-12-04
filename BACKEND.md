# Backend Complete Guide

This document consolidates all backend implementation details for Source Impact.

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Setup & Configuration](#setup--configuration)
3. [API Specification](#api-specification)
4. [Database Models](#database-models)
5. [Business Logic](#business-logic)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Overview & Architecture

### Tech Stack

**Core Backend:**
- **Language**: Node.js with TypeScript (or Python with FastAPI)
- **Framework**: Hono + tRPC (currently enabled)
- **Database**: PostgreSQL 14+ (Supabase recommended)
- **Cache**: Redis
- **Queue**: Bull (Redis-based) or AWS SQS

**Infrastructure:**
- **Hosting**: Railway, Render, AWS, or Google Cloud
- **Storage**: AWS S3 or Cloudinary
- **CDN**: CloudFront or Cloudflare
- **Monitoring**: Datadog or Sentry

**Third-Party Services:**
- **Payments**: Stripe Connect (primary)
- **Email**: SendGrid or AWS SES
- **SMS**: Twilio
- **Push Notifications**: FCM

---

## Setup & Configuration

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Configure:
   - **Name**: `source-impact`
   - **Database Password**: Create strong password (save this!)
   - **Region**: Choose closest to users
   - **Pricing Plan**: Free tier to start
4. Wait 2-3 minutes for provisioning

### Step 2: Get Database Connection String

1. In Supabase dashboard → **Settings** → **Database**
2. Copy connection string (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
3. Replace `[YOUR-PASSWORD]` with your password

### Step 3: Create Database Schema

In Supabase SQL Editor, run this complete schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('influencer', 'sponsor', 'agent', 'admin')),
  full_name VARCHAR(255),
  profile_image_url TEXT,
  bio TEXT,
  phone VARCHAR(50),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Influencer profiles
CREATE TABLE influencer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  influencer_type VARCHAR(50),
  follower_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.0,
  categories TEXT[],
  instagram_handle VARCHAR(255),
  tiktok_handle VARCHAR(255),
  youtube_handle VARCHAR(255),
  instagram_verified BOOLEAN DEFAULT FALSE,
  tiktok_verified BOOLEAN DEFAULT FALSE,
  youtube_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sponsor profiles
CREATE TABLE sponsor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  industry VARCHAR(255),
  website_url TEXT,
  company_size VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent profiles
CREATE TABLE agent_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'bronze',
  commission_balance DECIMAL(10,2) DEFAULT 0.0,
  total_commissions_earned DECIMAL(10,2) DEFAULT 0.0,
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  stripe_account_id VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  signed_up_at TIMESTAMP,
  first_deal_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gigs table
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  timeline VARCHAR(100),
  required_followers INTEGER,
  required_engagement_rate DECIMAL(5,2),
  required_influencer_types TEXT[],
  required_locations TEXT[],
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_rate DECIMAL(10,2),
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(gig_id, influencer_id)
);

-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreed_rate DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  escrow_job_id UUID,
  deliverables TEXT[],
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Escrow jobs table
CREATE TABLE escrow_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  influencer_amount DECIMAL(10,2) NOT NULL,
  state VARCHAR(50) DEFAULT 'pending_payment',
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  locked_at TIMESTAMP,
  released_at TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  stripe_transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  related_gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
  related_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  token_amount DECIMAL(18,8),
  description TEXT,
  trigger_event VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) UNIQUE,
  token_balance DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_gigs_sponsor ON gigs(sponsor_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_applications_gig ON applications(gig_id);
CREATE INDEX idx_applications_influencer ON applications(influencer_id);
CREATE INDEX idx_deals_sponsor ON deals(sponsor_id);
CREATE INDEX idx_deals_influencer ON deals(influencer_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_referrals_agent ON referrals(agent_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_influencer_profiles_updated_at BEFORE UPDATE ON influencer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sponsor_profiles_updated_at BEFORE UPDATE ON sponsor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_profiles_updated_at BEFORE UPDATE ON agent_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Configure Environment Variables

Create `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-random-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-random-refresh-secret-at-least-32-characters-long

# Backend API URL (set after deployment)
EXPO_PUBLIC_RORK_API_BASE_URL=

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Coinbase for crypto
COINBASE_API_KEY=...
```

### Step 5: Deploy Backend

**Option A: Deploy to Railway**

1. Sign up at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Railway auto-deploys
5. Get your backend URL

**Option B: Deploy to Render**

1. Sign up at [render.com](https://render.com)
2. New Web Service from GitHub
3. Configure:
   - Build: `bun install`
   - Start: `bun run backend/hono.ts`
4. Add environment variables
5. Deploy and get URL

### Step 6: Connect App to Backend

Update `.env.local`:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-app.railway.app
```

Restart Expo: `bun start --clear`

---

## API Specification

### Base URL
`https://api.sourceimpact.app/v1`

### Authentication
All protected endpoints require JWT Bearer token:
```
Authorization: Bearer {accessToken}
```

### Core Endpoints

#### Authentication

**POST /auth/register**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "influencer | sponsor | agent | admin",
  "referralCode": "string (optional)"
}
```

**POST /auth/login**
```json
{
  "email": "string",
  "password": "string"
}
```

#### Users & Profiles

**GET /users/{userId}**  
Get user profile with role-specific data

**PUT /users/{userId}**  
Update user profile

**POST /users/{userId}/verify-social**  
Initiate social media verification

#### Gigs

**POST /gigs**  
Create gig (Sponsor only)

**GET /gigs**  
List gigs with filters:
- `?category=fitness`
- `?minBudget=1000`
- `?maxBudget=5000`

**GET /gigs/{gigId}**  
Get gig details

#### Applications & Deals

**POST /applications**  
Apply to gig (Influencer only)

**PUT /applications/{id}**  
Update application status (Sponsor only)

**GET /deals**  
Get user's deals

#### Payments & Escrow

**POST /payments/escrow/lock**  
Lock funds in escrow

**POST /payments/escrow/{id}/release**  
Release funds to influencer

**POST /payments/escrow/{id}/refund**  
Refund to sponsor

**GET /payments/balance**  
Get user balance

#### Messaging

**GET /conversations**  
List conversations

**POST /conversations/{id}/messages**  
Send message

**GET /conversations/{id}/messages**  
Get messages

#### Agent System

**POST /agents/referrals**  
Record referral

**GET /agents/{id}/referrals**  
Get referrals

**GET /agents/{id}/commissions**  
Get commission history

---

## Database Models

### Key Relationships

**Users → Profiles**  
- One-to-one with influencer_profiles, sponsor_profiles, or agent_profiles

**Gigs → Applications → Deals**  
- Sponsor creates Gig
- Influencer submits Application
- Approved Application becomes Deal

**Escrow Workflow**  
- Deal → Escrow Job → Transactions

**Agent Referrals**  
- Agent → Referrals → Users
- Deal commission attribution

### Escrow States

```
pending_payment → payment_processing → locked → 
work_in_progress → work_submitted → under_review → 
approved → releasing → released

Alternative paths:
- locked → refunding → refunded
- any → disputed
```

---

## Business Logic

### Commission Distribution

**Platform Fee**: 10% of deal amount (added on top)

**Distribution Logic:**

```typescript
if (both recruited by same agent) {
  agent gets 100% of platform fee
} else if (different agents) {
  agent A gets 50%, agent B gets 50%
} else if (only one recruited) {
  that agent gets 100%
} else {
  platform keeps 100%
}
```

**Example**: $5,000 deal
- Platform fee: $500 (10%)
- Influencer receives: $5,000
- Sponsor pays: $5,500
- Agent commission: $500 (if attributed)

### Matching Algorithm

Score calculation (0-100):
- Category alignment: 40 points
- Budget vs rate match: 25 points
- Location match: 15 points
- Engagement rate: 10 points
- Follower count: 10 points

### Agent Tiers

| Tier | Completed Deals | Commission Rate | Bonus |
|------|----------------|-----------------|-------|
| Bronze | 0-9 | 10% | Base |
| Silver | 10-24 | 12% | +2% |
| Gold | 25-49 | 15% | +5% |
| Platinum | 50+ | 18% | +8% |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
- [x] Project setup
- [x] Database schema creation
- [ ] Authentication system
- [ ] User CRUD operations

### Phase 2: Core Features (Weeks 4-7)
- [ ] Gigs management
- [ ] Applications & deals
- [ ] Messaging system
- [ ] Matching algorithm

### Phase 3: Payments (Weeks 8-10)
- [ ] Stripe integration
- [ ] Escrow system
- [ ] Withdrawals

### Phase 4: Agent System (Weeks 11-13)
- [ ] Referral tracking
- [ ] Commission calculation
- [ ] Contact management

### Phase 5: Advanced (Weeks 14+)
- [ ] Rewards system
- [ ] Analytics
- [ ] Admin features

---

## Testing

### Test Database Connection

```bash
node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); client.connect().then(() => { console.log('✅ Connected!'); client.end(); }).catch(err => console.error('❌ Failed:', err));"
```

### Test Backend Health

```bash
curl https://your-backend-url.railway.app/
```

Expected: `{"status":"ok","message":"API is running"}`

---

## Troubleshooting

**Database connection failed:**
- Verify password in connection string
- Check Supabase project is active
- Test with psql client

**Backend not responding:**
- Check deployment logs
- Verify environment variables
- Check PORT configuration

**Stripe payments failing:**
- Use test mode keys during development
- Verify webhook signatures
- Check Stripe dashboard for errors

---

## Resources

- **Supabase**: https://supabase.com/docs
- **tRPC**: https://trpc.io/docs
- **Hono**: https://hono.dev/
- **Stripe**: https://stripe.com/docs/api
- **Railway**: https://docs.railway.app

---

**Last Updated**: 2025-12-04  
**Version**: 2.0 (Consolidated)
