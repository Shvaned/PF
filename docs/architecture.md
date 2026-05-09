# HireReady — Architecture

## Tech Stack
- **Framework**: Next.js 16.2.4 (App Router, Turbopack)
- **Frontend**: React 19, Tailwind CSS v4
- **Backend**: Next.js API routes (Edge-compatible where possible)
- **Database**: SQLite via Prisma v7.8.0 with `prisma-adapter-sqlite` (Node.js built-in `node:sqlite`)
- **Auth**: NextAuth v5 (Google OAuth provider + custom guest flow)
- **AI**: OpenAI SDK v6 (`gpt-4o-mini` model)
- **Payments**: Paddle SDK (custom checkout, webhooks)
- **PDF**: PDFKit
- **Analytics**: Custom lightweight event tracking via `/api/analytics`
- **Font**: Inter (Google Fonts)

## Database Schema (12 models)
- **User** — Core user with auth fields, isPremium, isGuest, dailyUsage
- **Account** — NextAuth provider accounts
- **Session** — NextAuth sessions
- **VerificationToken** — NextAuth email verification
- **Resume** — Raw resume text + file metadata
- **JobDescription** — Job description text + inferred category
- **Analysis** — Match score, strengths, keywords, weaknesses, suggestions, questions, guidance
- **InterviewPrep** — Links analysis to prep session
- **MockInterview** — Config, questions, scores, feedback, status
- **MockAnswer** — Individual Q&A with AI evaluation scores
- **WeakArea** — Accumulated weak areas across sessions with count
- **Subscription** — Paddle subscription data per user
- **UsageLog** — Action logs for analytics and rate limiting

## API Endpoints

| Method | Route | Auth | Premium | Purpose |
|--------|-------|------|---------|---------|
| GET/POST | `/api/auth/[...nextauth]` | No | No | NextAuth handler |
| POST | `/api/auth/guest` | No | No | Create guest session |
| POST | `/api/analyze` | Yes | No* | Run resume analysis (rate-limited for free) |
| POST | `/api/resume/parse` | Yes | No | Parse PDF resume |
| POST | `/api/mock-interview/start` | Yes | Yes | Generate mock questions, create session |
| GET/POST/PUT | `/api/mock-interview/[id]/answer` | Yes | Yes | Load, evaluate, complete interview |
| GET | `/api/export/pdf/[analysisId]` | Yes | Yes | Generate and download PDF report |
| POST | `/api/subscription/webhook` | No** | N/A | Paddle webhook handler |
| POST | `/api/analytics` | No | No | Log client-side events |
| POST | `/api/account/delete` | Yes | No | Delete user and all data |

*Free tier limited to 5/day via `checkUsageLimit()`  
**Verified via HMAC SHA-256 signature

## AI Prompts

Located in `src/lib/ai.ts`. Four prompt functions:

### 1. `analyzeResumeAndJob()` — Resume analysis
- Input: resume text + job description
- Model: gpt-4o-mini, temp 0.3, max_tokens 3000
- Output: JSON with matchScore (0-100), strengths[], missingKeywords[], weakAreas[], resumeImprovements[], summary, jobCategory, 8-12 questions with answer guidance
- Rules: specific to resume/JD, no generic filler, honest skill gap identification

### 2. `generateMockQuestions()` — Mock interview questions
- Input: resume, JD, difficulty, question types, count
- Model: gpt-4o-mini, temp 0.7, max_tokens 2000
- Output: JSON array of questions with type and relevance
- Rules: match difficulty level, focus on requested types, order warm-up → deep

### 3. `evaluateAnswer()` — Answer scoring
- Input: question, user answer, JD context, resume context
- Model: gpt-4o-mini, temp 0.3, max_tokens 1000
- Output: JSON with clarity, relevance, confidence, structure (all 1-10), feedback, missingPoints[]
- Rules: constructive tone for entry-level, practical feedback, don't invent weaknesses

### 4. `generateFinalReport()` — Session summary
- Input: questions, answers, scores
- Model: gpt-4o-mini, temp 0.3, max_tokens 1500
- Output: JSON with overallScore, categoryScores[], strongestArea, weakestArea, recurringWeakAreas[], improvementTips[], nextStep
- Rules: honest but encouraging, actionable tips, weakest area drives next step

## Auth Flow

### Google OAuth
1. User clicks "Continue with Google" on `/onboarding`
2. NextAuth redirects to Google consent screen
3. Google redirects back, NextAuth creates/links Account + User
4. Session callback enriches with isPremium, dailyUsage, isGuest from DB
5. `authjs.session-token` cookie set, user redirected to `/dashboard`

### Guest Mode
1. User clicks "Continue as Guest" on `/onboarding`
2. Client calls `POST /api/auth/guest`
3. Server creates User (isGuest=true, random email), Session record
4. Session cookie set, client redirects to `/dashboard`

### Auth Guard (proxy.ts)
- Checks `authjs.session-token` cookie on protected routes
- Redirects to `/onboarding` if missing
- Guest users have a valid session, so they pass through

## Premium Gating
- **Middleware level**: proxy.ts checks session existence only (not premium status)
- **Page level**: Pages check `isPremium` from session and conditionally render
- **API level**: Premium APIs return 403 if `isPremium !== true`
- **UI level**: `PremiumGate` component blurs locked content with upgrade CTA
- **Usage limits**: `checkUsageLimit()` returns `allowed: boolean` for free users

## Weak Area Tracking
- After each mock interview, `generateFinalReport()` identifies recurring weak areas
- Each weak area is upserted in the `WeakArea` table (increment count if exists)
- The mock report page queries accumulated weak areas with count > 1
- Displays trends: "You consistently struggle with [area]. Focus on this..."

## Directory Structure
```
src/
├── app/                    # App Router pages and API routes
│   ├── (auth)/             # Authenticated layout (Sidebar + Topbar)
│   ├── api/                # API route handlers
│   └── [pages]/            # Page components
├── components/
│   ├── ui/                 # Reusable UI components
│   └── interview/          # Interview-specific components
├── generated/prisma/       # Prisma client output
├── lib/                    # Service modules
│   ├── ai.ts               # OpenAI prompts
│   ├── analytics.ts        # Client-side tracking
│   ├── auth.ts             # NextAuth config
│   ├── paddle.ts           # Paddle SDK
│   ├── pdf.ts              # PDFKit report
│   ├── prisma.ts           # Prisma singleton
│   ├── resume.ts           # Text validation
│   └── usage.ts            # Rate limiting
├── proxy.ts                # Auth guard (replaces middleware)
├── globals.css             # Tailwind + theme
└── layout.tsx              # Root layout
```
