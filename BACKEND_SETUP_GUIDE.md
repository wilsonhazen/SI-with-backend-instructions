# Backend Setup & Configuration - Step by Step Guide

Complete guide for setting up and configuring the backend to get the Source Impact app working properly.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Local Development Setup](#local-development-setup)
4. [Deploying the Backend](#deploying-the-backend)
5. [Connecting the App to Backend](#connecting-the-app-to-backend)
6. [Testing the Connection](#testing-the-connection)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Bun package manager installed
- [ ] A Supabase account (free tier works)
- [ ] Git installed
- [ ] A text editor (VS Code recommended)
- [ ] A GitHub account (for deployment)

---

## Database Setup (Supabase)

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `source-impact` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select Free tier to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get Your Database Connection String

1. In your Supabase project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"Database"** in the settings menu
3. Scroll down to **"Connection string"** section
4. Select **"URI"** tab
5. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you created in Step 1
7. **Save this connection string** - you'll need it later

### Step 3: Create Database Schema

1. In Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Copy and paste the following SQL to create all necessary tables:

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

-- Create indexes for better query performance
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
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

CREATE TRIGGER update_escrow_jobs_updated_at BEFORE UPDATE ON escrow_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click **"Run"** to execute the SQL
5. You should see "Success. No rows returned" - this means all tables were created successfully

### Step 4: Verify Database Schema

1. In Supabase dashboard, click **"Table Editor"** in sidebar
2. You should see all the tables listed:
   - users
   - influencer_profiles
   - sponsor_profiles
   - agent_profiles
   - referrals
   - gigs
   - applications
   - deals
   - escrow_jobs
   - transactions
   - conversations
   - messages
   - notifications
   - rewards
   - wallets

---

## Local Development Setup

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
bun install
```

This will install all required packages including the backend dependencies.

### Step 2: Configure Environment Variables

1. Create a `.env.local` file in the root of your project:

```bash
touch .env.local
```

2. Open `.env.local` in your text editor and add:

```env
# Backend API URL - This will be set after deployment
# For now, leave it empty or use your local backend URL
EXPO_PUBLIC_RORK_API_BASE_URL=

# Database Connection (from Supabase Step 2)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# JWT Secrets (generate random strings)
JWT_SECRET=your-random-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-random-refresh-secret-at-least-32-characters-long

# Web URL for sharing
EXPO_PUBLIC_WEB_URL=https://sourceimpact.app
```

**To generate secure JWT secrets:**

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice to get two different secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

### Step 3: Test Database Connection

Create a test script to verify your database connection:

```bash
node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); client.connect().then(() => { console.log('✅ Database connected!'); client.end(); }).catch(err => console.error('❌ Connection failed:', err));"
```

You should see "✅ Database connected!"

---

## Deploying the Backend

The backend needs to be deployed to a hosting service to work with your mobile app. We'll use **Railway** (free tier available) or **Render** (free tier available).

### Option A: Deploy to Railway (Recommended)

#### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** and sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Connect your GitHub account and select your repository
6. Railway will automatically detect it's a Node.js project

#### Step 2: Configure Environment Variables

1. In your Railway project, click on the service
2. Click **"Variables"** tab
3. Click **"New Variable"** and add each of these:
   - `DATABASE_URL` - Your Supabase connection string
   - `JWT_SECRET` - Your JWT secret
   - `JWT_REFRESH_SECRET` - Your JWT refresh secret
   - `NODE_ENV` - Set to `production`
   - `PORT` - Set to `3000`

#### Step 3: Add Start Script

Railway needs a start command. In your `package.json`, ensure you have:

```json
{
  "scripts": {
    "start": "bun run backend/hono.ts"
  }
}
```

#### Step 4: Get Your Backend URL

1. In Railway, click **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Copy the domain (e.g., `https://your-app.railway.app`)
5. **Save this URL** - you'll need it in the next section

### Option B: Deploy to Render

#### Step 1: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** and sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository

#### Step 2: Configure Service

1. **Name**: `source-impact-backend`
2. **Environment**: `Node`
3. **Build Command**: `bun install`
4. **Start Command**: `bun run backend/hono.ts`
5. **Instance Type**: Select Free tier

#### Step 3: Add Environment Variables

In the Environment section, add:
- `DATABASE_URL` - Your Supabase connection string
- `JWT_SECRET` - Your JWT secret
- `JWT_REFRESH_SECRET` - Your JWT refresh secret
- `NODE_ENV` - Set to `production`

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your service URL (e.g., `https://source-impact-backend.onrender.com`)

---

## Connecting the App to Backend

### Step 1: Update Environment Variables

1. Open your `.env.local` file
2. Update `EXPO_PUBLIC_RORK_API_BASE_URL` with your backend URL:

```env
# Railway example
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-app.railway.app

# OR Render example
EXPO_PUBLIC_RORK_API_BASE_URL=https://source-impact-backend.onrender.com
```

3. Save the file

### Step 2: Restart the Expo Development Server

1. Stop your current Expo server (Ctrl+C)
2. Clear the cache and restart:

```bash
bun start --clear
```

3. Press `r` to reload the app

---

## Testing the Connection

### Step 1: Test Backend Health

1. Open a browser or use curl to test your backend:

```bash
curl https://your-backend-url.railway.app/
```

You should see:
```json
{"status":"ok","message":"API is running"}
```

### Step 2: Test tRPC Endpoint

Test the example tRPC endpoint:

```bash
curl https://your-backend-url.railway.app/api/trpc/example.hi
```

### Step 3: Test from the App

1. Open your app in Expo Go or simulator
2. The app should now be able to connect to the backend
3. Try creating an account or logging in
4. Check the Expo console for any errors

---

## Troubleshooting

### Issue: "No base url found" Error

**Solution:**
1. Make sure `.env.local` exists in project root
2. Make sure `EXPO_PUBLIC_RORK_API_BASE_URL` is set
3. Restart Expo with `bun start --clear`
4. Environment variables must start with `EXPO_PUBLIC_` to be available in the app

### Issue: Database Connection Failed

**Solution:**
1. Verify your Supabase project is active
2. Check the database password in your connection string
3. Make sure the connection string format is correct:
   ```
   postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
4. Test connection using the test script in Step 3 of Local Development Setup

### Issue: Backend Not Responding

**Solution:**
1. Check backend logs in Railway/Render dashboard
2. Verify all environment variables are set correctly
3. Make sure PORT is set to 3000
4. Check if the backend is running (look for status in dashboard)

### Issue: CORS Errors

**Solution:**
The backend already has CORS enabled in `backend/hono.ts`. If you still see CORS errors:
1. Make sure your backend URL is correct
2. Check that the backend is actually running
3. Verify CORS middleware is applied in `backend/hono.ts`

### Issue: JWT Token Errors

**Solution:**
1. Make sure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
2. Secrets should be at least 32 characters
3. Make sure they match between local and deployed environments
4. Clear app data and try logging in again

### Issue: Tables Not Created

**Solution:**
1. Go back to Supabase SQL Editor
2. Clear the editor and paste the SQL again
3. Run the query
4. Check for any error messages
5. Make sure you're in the correct project

---

## Next Steps

After completing this setup:

1. **Test all features**: Try creating accounts, gigs, applications
2. **Add authentication endpoints**: Implement login/register in your tRPC routes
3. **Implement business logic**: Add the commission, escrow, and payment logic
4. **Set up Stripe**: Configure Stripe for payments (see STRIPE_INTEGRATION_GUIDE.md)
5. **Add monitoring**: Set up error tracking (Sentry) and analytics

---

## Additional Resources

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **tRPC Documentation**: [trpc.io/docs](https://trpc.io/docs)
- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Expo Environment Variables**: [docs.expo.dev/guides/environment-variables](https://docs.expo.dev/guides/environment-variables)

---

## Support

If you encounter issues not covered in this guide:

1. Check the backend logs in your hosting dashboard
2. Check Expo console for client-side errors
3. Verify all environment variables are set correctly
4. Review the existing documentation files:
   - `BACKEND_API_SPEC.md`
   - `BACKEND_DATA_MODELS.md`
   - `BACKEND_BUSINESS_LOGIC.md`
   - `BACKEND_IMPLEMENTATION_GUIDE.md`

---

## Summary Checklist

- [ ] Created Supabase project
- [ ] Got database connection string
- [ ] Created all database tables using SQL
- [ ] Verified tables in Supabase Table Editor
- [ ] Created `.env.local` file
- [ ] Added DATABASE_URL to `.env.local`
- [ ] Generated and added JWT secrets
- [ ] Tested database connection locally
- [ ] Deployed backend to Railway or Render
- [ ] Added environment variables to hosting service
- [ ] Got backend URL from hosting service
- [ ] Updated EXPO_PUBLIC_RORK_API_BASE_URL in `.env.local`
- [ ] Restarted Expo with cache clear
- [ ] Tested backend health endpoint
- [ ] Tested tRPC endpoint
- [ ] Tested app connection

Once all items are checked, your backend is fully set up and ready to use!
