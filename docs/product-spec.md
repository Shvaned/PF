# HireReady — Product Specification

## Elevator Pitch
HireReady is an AI-powered interview preparation app for entry-level job seekers (0-2 years experience). Upload your resume, paste a job description, and get a match score, strengths, weaknesses, tailored interview questions, and answer guidance — all in minutes.

## Target Users
- Fresh graduates and internship applicants
- Entry-level job seekers with 0-2 years of experience
- Global audience

## User Flows

### Primary Flow
```
Onboarding → Sign In (Google or Guest) → Dashboard
  → Analyze Resume (paste or upload PDF)
  → Paste Job Description
  → "Analyze Now" → Results Screen
  → "Start Interview Prep" → Interview Prep Screen (questions + answer guidance)
  → [Premium] "Start Mock Interview" → Interactive AI Mock Interview → Final Report
```

### Secondary Flows
- Dashboard → History → View past analysis / View mock report
- Dashboard → Settings → Manage account / Delete account
- Dashboard → Premium → Subscribe ($9.99/mo via Paddle)

## Screen-by-Screen

| # | Screen | Route | Description |
|---|--------|-------|-------------|
| 1 | Onboarding | `/onboarding` | Welcome, Google sign-in, Guest mode, premium teaser |
| 2 | Sign-in | `/signin` | NextAuth sign-in page |
| 3 | Dashboard | `/dashboard` | 3 action cards (Analyze, Prep, Mock), usage tracker, tips, recent analysis |
| 4 | Analyze | `/analyze` | Paste resume / Upload PDF toggle, job description textarea, "Analyze Now" CTA |
| 5 | Results | `/analyze/results/[id]` | Match score ring, strengths/weak/keywords/suggestions grids, "Start Interview Prep" CTA |
| 6 | Interview Prep | `/prep/[analysisId]` | Question accordion list + answer guidance, Mock Interview CTA (premium) |
| 7 | Mock Setup | `/mock-interview` | Difficulty, question types, question count config |
| 8 | Mock Session | `/mock-interview/[id]` | Chat-style Q&A with AI evaluation |
| 9 | Mock Report | `/mock-interview/[id]/report` | Overall score, category scores, trends, tips, next steps |
| 10 | History | `/history` | Past analyses + mock interviews (free: last 5, premium: unlimited) |
| 11 | Settings | `/settings` | Account info, subscription status, delete account |
| 12 | Premium | `/premium` | Plan comparison, $9.99/mo subscribe button |

## Free vs Premium

| Feature | Free | Premium ($9.99/mo) |
|---------|------|---------------------|
| Resume analysis | 5/day | Unlimited |
| Interview questions | Yes | Yes |
| Answer guidance | Yes | Yes |
| Mock interview | No | Yes |
| PDF export | No | Yes |
| Saved history | Last 5 | Unlimited |
| Weak area tracking | No | Yes |
| Progress trends | No | Yes |

## MVP Implementation Order
1. Onboarding and auth (Google OAuth + Guest)
2. Resume upload and PDF parsing
3. Job description input
4. Analysis engine (AI prompts)
5. Results screen
6. Interview prep screen
7. Freemium gating (usage limits)
8. Paddle subscription integration
9. Advanced mock interview
10. PDF export
11. Analytics
12. History and weak-area tracking
13. Polish and deployment
