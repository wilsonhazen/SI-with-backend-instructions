# Backend Setup & Configuration Guide

## Overview

This guide provides step-by-step instructions for setting up and configuring the backend for the Source Impact app. The backend uses **Hono** (lightweight web framework) and **tRPC** (end-to-end typesafe APIs) to provide a robust API layer.

---

## Architecture

```
┌─────────────────┐
│  React Native   │
│  Client (Expo)  │
└────────┬────────┘
         │ HTTP/tRPC
         ▼
┌─────────────────┐
│  Hono Server    │
│  (backend/)     │
├─────────────────┤
│  tRPC Router    │
│  (trpc/)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│   (Supabase/    │
│    PostgreSQL)  │
└─────────────────┘
```

**Tech Stack:**
- **Hono**: Fast, lightweight web framework
- **tRPC**: Type-safe API layer with automatic TypeScript inference
- **SuperJSON**: Enhanced JSON serialization (supports Date, Map, Set, etc.)
- **Zod**: Schema validation
- **Supabase/PostgreSQL**: Database (recommended)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- ✅ Git installed
- ✅ Text editor (VS Code recommended)
- ✅ Basic knowledge of TypeScript and React Native

---

## Quick Start (5 Minutes)

### 1. Clone and Install

```bash
# Clone your repository
git clone <your-repo-url>
cd <your-project>

# Install dependencies
bun install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required: API Base URL
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081

# Optional: Web URL for sharing
EXPO_PUBLIC_WEB_URL=https://sourceimpact.app

# Database (if using Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication (generate a secure random string)
JWT_SECRET=your-secret-key-here-change-this

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the Development Server

```bash
# Start both frontend and backend
bun start

# Or start with web preview
bun run start-web
```

The backend will automatically start on **http://localhost:8081/api**

### 4. Test the Backend

Open your browser and navigate to:
```
http://localhost:8081/api
```

You should see:
```json
{
  "status": "ok",
  "message": "API is running"
}
```

**Test tRPC endpoint:**
```
http://localhost:8081/api/trpc/example.hi
```

---

## Project Structure

```
project-root/
├── backend/
│   ├── hono.ts                    # Main server file
│   └── trpc/
│       ├── create-context.ts      # tRPC context & initialization
│       ├── app-router.ts          # Main tRPC router
│       └── routes/
│           └── example/
│               └── hi/
│                   └── route.ts   # Example route
├── lib/
│   └── trpc.ts                    # Client-side tRPC setup
└── app/
    └── (your React Native pages)
```

---

## Step-by-Step Configuration

### Step 1: Understanding the Backend Entry Point

**File: `backend/hono.ts`**

```typescript
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Enable CORS for cross-origin requests
app.use("*", cors());

// Mount tRPC router
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
```

**Key Points:**
- All tRPC routes are mounted at `/api/trpc`
- CORS is enabled for React Native web compatibility
- Health check available at `/api`

---

### Step 2: Setting Up tRPC Context

**File: `backend/trpc/create-context.ts`**

The context is where you add authentication, database connections, and other request-scoped data.

**Basic Setup (Current):**
```typescript
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    req: opts.req,
  };
};
```

**Enhanced Setup with Authentication:**
```typescript
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract auth token from headers
  const authHeader = opts.req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  let user = null;
  if (token) {
    // Verify JWT token
    try {
      user = await verifyToken(token);
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }
  
  return {
    req: opts.req,
    user,  // Authenticated user (or null)
  };
};
```

**Create Protected Procedures:**

Add after `publicProcedure`:

```typescript
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
```

---

### Step 3: Creating tRPC Routes

**File Structure for Routes:**
```
backend/trpc/routes/
├── auth/
│   ├── login/
│   │   └── route.ts
│   └── register/
│       └── route.ts
├── users/
│   ├── profile/
│   │   └── route.ts
│   └── update/
│       └── route.ts
└── gigs/
    ├── list/
    │   └── route.ts
    └── create/
        └── route.ts
```

**Example Route: `backend/trpc/routes/auth/login/route.ts`**

```typescript
import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

const loginProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }))
  .mutation(async ({ input }) => {
    // Your login logic here
    const user = await authenticateUser(input.email, input.password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const token = generateJWT(user);
    
    return {
      success: true,
      user,
      token,
    };
  });

export default loginProcedure;
```

**Register Route in Router: `backend/trpc/app-router.ts`**

```typescript
import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import loginRoute from "./routes/auth/login/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    login: loginRoute,
  }),
});

export type AppRouter = typeof appRouter;
```

---

### Step 4: Using tRPC in React Native

**Query Example:**

```typescript
import { trpc } from '@/lib/trpc';

function ProfileScreen() {
  const profileQuery = trpc.users.profile.useQuery();
  
  if (profileQuery.isLoading) {
    return <Text>Loading...</Text>;
  }
  
  if (profileQuery.error) {
    return <Text>Error: {profileQuery.error.message}</Text>;
  }
  
  return <Text>Hello, {profileQuery.data.name}!</Text>;
}
```

**Mutation Example:**

```typescript
import { trpc } from '@/lib/trpc';

function LoginScreen() {
  const loginMutation = trpc.auth.login.useMutation();
  
  const handleLogin = async () => {
    try {
      const result = await loginMutation.mutateAsync({
        email: 'user@example.com',
        password: 'password123',
      });
      
      console.log('Login success:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <Button 
      onPress={handleLogin}
      disabled={loginMutation.isLoading}
    >
      {loginMutation.isLoading ? 'Logging in...' : 'Login'}
    </Button>
  );
}
```

**Non-React Usage (Utils/Services):**

```typescript
import { trpcClient } from '@/lib/trpc';

// In a utility file or service
export async function fetchUserProfile(userId: string) {
  const profile = await trpcClient.users.profile.query({ userId });
  return profile;
}
```

---

## Database Setup

### Option 1: Supabase (Recommended)

**1. Create Supabase Project:**
- Go to https://supabase.com
- Create a new project
- Note your connection string

**2. Add to `.env.local`:**
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**3. Install Supabase Client:**
```bash
bun add @supabase/supabase-js
```

**4. Create Database Client: `lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**5. Use in tRPC Routes:**
```typescript
import { supabase } from '@/lib/supabase';

const getUserProcedure = publicProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ input }) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', input.userId)
      .single();
    
    if (error) throw error;
    return data;
  });
```

### Option 2: PostgreSQL (Direct)

**1. Install PostgreSQL Locally:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt-get install postgresql
sudo service postgresql start
```

**2. Install pg driver:**
```bash
bun add pg
bun add -d @types/pg
```

**3. Create Database Connection: `lib/db.ts`**
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

---

## Authentication Setup

### JWT Authentication

**1. Install Dependencies:**
```bash
bun add jsonwebtoken bcryptjs
bun add -d @types/jsonwebtoken @types/bcryptjs
```

**2. Create Auth Utils: `utils/auth.ts`**

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**3. Update Context in `backend/trpc/create-context.ts`:**

```typescript
import { verifyToken } from '@/utils/auth';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  let user = null;
  if (token) {
    try {
      user = verifyToken(token);
    } catch (error) {
      console.log('Invalid token');
    }
  }
  
  return {
    req: opts.req,
    user,
  };
};

// Add protected procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized - Please login');
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

---

## Adding Stripe Payments

**1. Install Stripe:**
```bash
bun add stripe
```

**2. Create Stripe Client: `lib/stripe.ts`**
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
```

**3. Create Payment Route: `backend/trpc/routes/payments/create-intent/route.ts`**

```typescript
import { protectedProcedure } from '../../../create-context';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const createPaymentIntentProcedure = protectedProcedure
  .input(z.object({
    amount: z.number().positive(),
    currency: z.string().default('usd'),
  }))
  .mutation(async ({ input, ctx }) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // Convert to cents
      currency: input.currency,
      metadata: {
        userId: ctx.user.userId,
      },
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  });

export default createPaymentIntentProcedure;
```

---

## Testing

### Manual Testing

**1. Test Health Endpoint:**
```bash
curl http://localhost:8081/api
```

**2. Test tRPC Query:**
```bash
curl http://localhost:8081/api/trpc/example.hi
```

**3. Test Protected Route:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/api/trpc/users.profile
```

### Automated Testing

**Install Testing Tools:**
```bash
bun add -d vitest @vitest/ui
```

**Create Test: `backend/trpc/routes/auth/login/route.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '../../../app-router';

describe('Login', () => {
  it('should authenticate valid user', async () => {
    const caller = appRouter.createCaller({ req: {} as any, user: null });
    
    const result = await caller.auth.login({
      email: 'test@example.com',
      password: 'password123',
    });
    
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});
```

---

## Deployment

### Deploying to Production

**1. Railway (Recommended):**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

Add environment variables in Railway dashboard.

**2. Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**3. Render.com:**
- Connect GitHub repository
- Add environment variables
- Deploy automatically on push

---

## Environment Variables Reference

### Required Variables

```bash
# API Base URL (Development)
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081

# API Base URL (Production)
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-api.com

# Authentication
JWT_SECRET=<generate-secure-random-string>

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Optional Variables

```bash
# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-key

# Email (SendGrid)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@yourapp.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
```

---

## Troubleshooting

### Common Issues

**1. "No base url found" Error**

**Solution:** Add `EXPO_PUBLIC_RORK_API_BASE_URL` to `.env.local`:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
```

**2. CORS Errors on Web**

**Solution:** Ensure CORS is enabled in `backend/hono.ts`:
```typescript
app.use("*", cors());
```

**3. tRPC Type Errors**

**Solution:** Restart TypeScript server in VS Code:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type "TypeScript: Restart TS Server"

**4. Database Connection Fails**

**Solution:** Check your `DATABASE_URL` format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**5. Backend Not Starting**

**Solution:** Check if port 8081 is already in use:
```bash
lsof -i :8081
kill -9 <PID>
```

---

## Best Practices

### Security

1. **Never commit secrets** - Use `.env.local` (gitignored)
2. **Validate all inputs** - Use Zod schemas
3. **Use protected procedures** - For authenticated routes
4. **Hash passwords** - Use bcrypt with salt rounds ≥ 10
5. **Implement rate limiting** - Prevent abuse
6. **Use HTTPS in production** - Always

### Code Organization

1. **One procedure per file** - Easy to find and maintain
2. **Group related routes** - Use nested routers
3. **Reuse validation schemas** - Create shared Zod schemas
4. **Type everything** - Leverage TypeScript
5. **Add error handling** - Use try/catch blocks
6. **Log important events** - Use console.log for debugging

### Performance

1. **Use database indexes** - For frequently queried fields
2. **Implement caching** - Use Redis for hot data
3. **Optimize queries** - Select only needed fields
4. **Use pagination** - For large datasets
5. **Monitor performance** - Use logging/monitoring tools

---

## Next Steps

1. ✅ Set up database schema (see `BACKEND_DATA_MODELS.md`)
2. ✅ Implement authentication endpoints
3. ✅ Create user management routes
4. ✅ Add gig/deal management
5. ✅ Implement payment integration
6. ✅ Set up email/SMS notifications
7. ✅ Add real-time features (WebSocket)
8. ✅ Deploy to production

---

## Additional Resources

### Documentation
- **tRPC**: https://trpc.io/docs
- **Hono**: https://hono.dev
- **Zod**: https://zod.dev
- **Supabase**: https://supabase.com/docs

### Related Files
- `BACKEND_API_SPEC.md` - Complete API specification
- `BACKEND_DATA_MODELS.md` - Database schema
- `BACKEND_BUSINESS_LOGIC.md` - Business rules
- `BACKEND_IMPLEMENTATION_GUIDE.md` - Implementation roadmap

### Support

For issues or questions:
1. Check this guide first
2. Review existing documentation files
3. Check GitHub issues
4. Contact the development team

---

## Quick Reference

### Create New Route

```bash
# 1. Create route file
mkdir -p backend/trpc/routes/users/profile
touch backend/trpc/routes/users/profile/route.ts

# 2. Write route code
# (See examples above)

# 3. Register in app-router.ts
# Import and add to router

# 4. Use in React Native
# trpc.users.profile.useQuery()
```

### Common Commands

```bash
# Start dev server
bun start

# Run tests
bun test

# Check types
bunx tsc --noEmit

# Lint code
bun run lint

# Deploy
vercel deploy
```

---

**Happy coding! 🚀**

If you encounter any issues not covered in this guide, please update this document or reach out to the development team.
