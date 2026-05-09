# HireReady — Launch Checklist

## Pre-Launch
- [ ] Set real `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`
- [ ] Set real `OPENAI_API_KEY` in `.env`
- [ ] Set real Paddle keys (`PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRODUCT_ID`, `PADDLE_PRICE_ID`)
- [ ] Generate strong `AUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Create Paddle product + price ($9.99/mo) in Paddle dashboard
- [ ] Configure Paddle webhook endpoint to `https://<domain>/api/subscription/webhook`
- [ ] Create Google Cloud OAuth consent screen + credentials
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Run `npx prisma db push` to ensure schema is in sync
- [ ] Test Google sign-in flow end-to-end
- [ ] Test guest mode flow
- [ ] Test resume analysis flow (paste + PDF upload)
- [ ] Test mock interview flow end-to-end
- [ ] Test PDF export
- [ ] Test Paddle checkout + webhook (use Paddle sandbox)
- [ ] Test subscription cancel → entitlement revoke
- [ ] Test delete account flow
- [ ] Test rate limiting (5/day for free users)
- [ ] Test mobile responsiveness on iOS Safari + Android Chrome
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Configure production database (SQLite file path or consider Turso/LiteFS for multi-instance)
- [ ] Set up automated backups for production DB

## Post-Launch (MVP +)
- [ ] Add email/password auth option
- [ ] Implement "share report" feature
- [ ] Add interview question difficulty progression based on past performance
- [ ] Add voice recording for mock interviews
- [ ] Add TTS for AI questions
- [ ] Build candidate-facing share link (share analysis with mentor/friend)
- [ ] Add more granular usage analytics dashboard
- [ ] Implement A/B testing for conversion optimization
- [ ] Add localized UI for non-English speakers
- [ ] Build employer-side product (job description → candidate screening)

## Post-MVP Roadmap

### Phase 1 — Polish (Month 1)
- Onboarding walkthrough/tutorial for first-time users
- Resume formatting improvements (better PDF parsing)
- Email notifications for subscription events
- Improved mobile UX

### Phase 2 — Growth (Month 2-3)
- Referral program ("invite a friend, get a free analysis")
- Multi-language support
- Interview question library by job category
- Performance analytics dashboard for users

### Phase 3 — Scale (Month 3-6)
- Voice-based mock interviews (TTS + recording)
- Employer portal (screen candidates)
- API for ATS integration
- Team/enterprise plans
