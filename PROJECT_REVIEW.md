# Bayara — Full Codebase Review & Development Plan

> Bayara is a bilingual (Arabic/English) UAE real estate marketplace clone of Bayut.
> Stack: Next.js 16 + Express.js + Prisma + PostgreSQL + Stripe + Resend + AWS S3

---

## Current State Summary

| Layer | Completeness | Notes |
|-------|-------------|-------|
| Backend API | **~70%** | Core CRUD + search + payments + email complete |
| Frontend | **~85%** | All pages/routes built, some features stubbed |
| Shared Types | **90%** | Comprehensive Zod schemas + TypeScript DTOs |
| Infrastructure | **75%** | CI/CD, Docker, nginx done; missing tests |
| Overall | **~75%** | Functional end-to-end, gaps in "sticky" features |

---

## PART 1: What's Done

### 1.1 Auth System (COMPLETE)

- [x] Register with email/password (buyer or agent role)
- [x] Login with JWT access + refresh tokens (httpOnly cookies)
- [x] Token rotation on refresh (old token revoked in DB)
- [x] Forgot password (token generated, stored in DB with 1hr expiry)
- [x] Reset password with token
- [x] Logout (invalidate refresh token + clear cookies)
- [x] Role-based access control: BUYER, AGENT, AGENCY_ADMIN, ADMIN
- [x] Middleware route protection (edge-compatible JWT decode)
- [x] Auto-refresh on 401 in server-side fetch

### 1.2 Property Listings (COMPLETE)

- [x] Full CRUD (create, read, update, delete)
- [x] Search with filters: listingType, propertyType, bedrooms, bathrooms, furnished, price range, keyword
- [x] Sorting: newest, price_asc, price_desc
- [x] Pagination
- [x] Featured listings
- [x] Auto-generated slugs
- [x] View count tracking
- [x] Status workflow: DRAFT -> ACTIVE -> RESERVED/SOLD/RENTED/EXPIRED
- [x] Admin property review (approve/reject drafts)
- [x] Emirate -> Community -> SubCommunity location hierarchy

### 1.3 Agent System (COMPLETE)

- [x] Agent application (with agency assignment)
- [x] Admin review (approve/reject with transactional role upgrade)
- [x] Agent dashboard (stats, property management)
- [x] Public agent profile with property listings
- [x] Agent bio and languages

### 1.4 Lead / Inquiry System (COMPLETE)

- [x] Guest + authenticated inquiry submission
- [x] Agent lead inbox with status management (NEW/CONTACTED/QUALIFIED/CLOSED/SPAM)
- [x] Admin sees all leads
- [x] Email notification to property owner on new lead

### 1.5 Favorites & Saved Searches (COMPLETE)

- [x] Toggle favorite from card and detail page
- [x] Favorites list in buyer dashboard
- [x] Create / list / delete saved searches
- [ ] Saved search email alerts (backend ready, trigger not wired)

### 1.6 Payments (COMPLETE)

- [x] Stripe Checkout Sessions (hosted payment page)
- [x] Webhook handler with HMAC signature verification
- [x] Payment purposes: Subscription, Listing Boost, Lead Credits, Property Reservation
- [x] Subscription management (create/extend/cancel)
- [x] Payment history
- [x] Refund support
- [x] Mock checkout fallback in development mode
- [x] Idempotency key for duplicate prevention

### 1.7 Viewings (PARTIAL — free mode)

- [x] Request viewing with calendar/time slot picker
- [x] Cancel viewing
- [x] Agent status updates (COMPLETED, NO_SHOW, etc.)
- [x] Email confirmations
- [x] Minimum hours ahead enforcement (2hr)
- [ ] **Viewing deposit payment** (schema exists but disabled — deposits are set to 0)

### 1.8 File Uploads (COMPLETE)

- [x] S3 pre-signed URLs for upload
- [x] Pre-signed URLs for download
- [x] File streaming proxy

### 1.9 Email (PARTIAL)

- [x] Resend integration with configurable sender
- [x] 7 bilingual templates (Arabic + English): agent approved/rejected, new lead, viewing confirmed/cancelled, payment failed, saved search match, property reservation
- [ ] **Password reset email** (token generated but email not sent — TODO in code)
- [ ] Hardcoded Arabic locale (should come from user preference)

### 1.10 Frontend Pages (COMPLETE)

| Page | Route | Status |
|------|-------|--------|
| Homepage | `/` | Hero, search bar, featured, how-it-works, CTA |
| Buy listings | `/buy` | Full filter sidebar + pagination |
| Rent listings | `/rent` | Full filter sidebar + pagination |
| Property detail | `/properties/[slug]` | Gallery, stats, description, JSON-LD, contact form |
| Agent profile | `/agents/[id]` | Bio, license, listings grid |
| Become agent | `/become-agent` | Landing page with pricing |
| Login | `/login` | JWT cookie auth |
| Register | `/register` | Buyer/agent role selection |
| Forgot password | `/forgot-password` | Email-based reset request |
| Reset password | `/reset-password` | Token-based password reset |
| Buyer dashboard | `/dashboard` | Favorites, saved searches, inquiries, reservations |
| Buyer settings | `/dashboard/settings` | Profile + password update |
| Buyer viewings | `/dashboard/viewings` | Viewings list with cancel |
| Agent dashboard | `/agent/dashboard` | Stats, properties, leads |
| Agent properties | `/agent/properties` | CRUD list |
| New property | `/agent/properties/new` | Property creation form |
| Agent billing | `/agent/billing` | Subscription plans + checkout |
| Agent viewings | `/agent/viewings` | Agent viewing management |
| Agent transactions | `/agent/transactions` | Buyer reservation transactions |
| Agent settings | `/agent/settings` | Profile + bio + password |
| Property boost | `/agent/properties/[id]/boost` | Featured listing payment |
| Admin dashboard | `/admin/dashboard` | Stats, users, agents, properties, payments |
| Payment success | `/payments/success` | Payment confirmation with polling |
| Payment cancel | `/payments/cancel` | Payment cancelled page |
| 404 | `/*` | Custom not-found page |

### 1.11 i18n (COMPLETE)

- [x] Full Arabic (RTL) + English (LTR) support
- [x] 30 translation namespaces
- [x] Locale switching
- [x] SEO metadata per locale
- [x] URL locale prefix (`as-needed`)

### 1.12 SEO (COMPLETE)

- [x] OpenGraph meta tags
- [x] Twitter cards
- [x] JSON-LD RealEstateListing schema on property detail
- [x] Canonical URLs with locale alternates
- [x] robots.txt (blocks dashboard/agent/admin/api)
- [x] `generateMetadata` on all pages
- [ ] Dynamic sitemap (static URLs only — property URLs commented out)

### 1.13 Infrastructure (COMPLETE)

- [x] Turborepo monorepo setup
- [x] Shared types package (`@repo/types`)
- [x] ESLint configs (base, next-js, react-internal)
- [x] TypeScript configs (base, nextjs, react-library)
- [x] Docker Compose (dev: postgres only, prod: postgres + api)
- [x] Nginx reverse proxy with rate limiting + security headers
- [x] GitHub Actions CI/CD (build -> Docker -> Railway deploy + Prisma migrate)
- [x] Health check endpoint (pings database)
- [x] Graceful shutdown handling

---

## PART 2: What's Partially Built

### 2.1 Property Edit Page

Agent properties list links to `/agent/properties/[id]/edit` but **no `page.tsx` exists** for that route.

**Status:** Clicking edit leads to 404.

### 2.2 Property Image Upload

The property creation form has fields for title, description, price, location, amenities — but **no image upload UI**. The backend supports pre-signed S3 uploads and the PropertyImage model exists, but the form doesn't wire them together.

### 2.3 Property Delete

Delete button exists in agent properties list but **has no `onClick` handler**.

### 2.4 Saved Search Creation

Dashboard shows saved searches, but **no UI to create them from the search page**. The backend API exists (POST `/saved-searches`).

### 2.5 Sitemap

Static pages only. Dynamic property URL generation is commented out in `app/sitemap.ts`.

### 2.6 Communities Section

Homepage communities grid is **commented out** in `page.tsx`.

### 2.7 Agent Analytics

"Analytics Coming Soon" placeholder in agent dashboard. No chart library installed.

### 2.8 Admin Settings

Security/General settings buttons are **disabled** in admin dashboard.

### 2.9 Viewing Deposits

Full deposit infrastructure exists in the schema (depositStatus, depositAmount, depositPaymentId, VIEWING_DEPOSIT payment purpose, deposit policy types). The `requestViewing()` function creates viewings as **free** (depositAmount=0, status=CONFIRMED directly).

### 2.10 Password Reset Email

`requestPasswordReset()` generates a token and stores it in DB but **never sends the email**. The token is only logged in development mode.

---

## PART 3: What's Missing (Priority Order)

### P0 — Must Have for Production

| # | Feature | Backend | Frontend | Effort |
|---|---------|---------|----------|--------|
| 1 | **Property image upload UI** | S3 presign exists | Need multi-image upload form with drag-drop, preview, cover selection | Medium |
| 2 | **Property edit page** | PATCH endpoint exists | Need `[id]/edit/page.tsx` with pre-filled form | Small |
| 3 | **Property delete (wire button)** | DELETE endpoint exists | Add onClick confirmation dialog + API call | Small |
| 4 | **Password reset email** | Token generation exists | Need to send email with reset link via Resend | Small |
| 5 | **Dynamic sitemap** | — | Uncomment + fetch all active property slugs for sitemap | Small |
| 6 | **Saved search creation UI** | POST endpoint exists | Add "Save Search" button on search results page | Small |
| 7 | **Agent property status management** | Status update exists | UI for agents to mark properties as SOLD/RENTED/EXPIRED | Small |
| 8 | **Input sanitization** | No XSS protection | Add HTML sanitization on user-submitted text (descriptions, messages) | Small |
| 9 | **Email verification** | User.isVerified exists but no flow | Need verification email on register + verify endpoint | Medium |
| 10 | **Error toasts on failures** | — | Favorite errors, lead submission errors, viewing errors all silently swallowed | Small |

### P1 — Should Have (Differentiating Features)

| # | Feature | Backend | Frontend | Effort |
|---|---------|---------|----------|--------|
| 11 | **Map-based search** | latitude/longitude exist on Property | Integrate Mapbox/Google Maps for geographic search + cluster markers | Large |
| 12 | **Chat / Messaging** | Need new Message model + real-time endpoint | Need chat UI between buyers and agents | Large |
| 13 | **Notification system** | Need Notification model + read/unread | Need notification bell + dropdown + preferences | Large |
| 14 | **Dark mode** | — | `next-themes` is installed but unused; add ThemeProvider + toggle | Small |
| 15 | **Agent reviews / ratings** | Need Review model + CRUD endpoints | Need star rating UI on agent profiles | Medium |
| 16 | **Mortgage calculator** | — | Client-side calculator widget on property detail | Small |
| 17 | **Property comparison** | Need comparison model or client-side storage | Side-by-side property comparison page | Medium |
| 18 | **Saved search email alerts** | Template exists, trigger logic needed | Toggle UI exists in dashboard | Medium |
| 19 | **Viewing deposit payments** | Schema exists, wire VIEWING_DEPOSIT purpose | Update RequestViewingButton for deposit flow | Medium |
| 20 | **Agency management API** | Agency model exists, no CRUD API | Admin UI to create/edit agencies | Medium |

### P2 — Nice to Have (Completeness)

| # | Feature | Backend | Frontend | Effort |
|---|---------|---------|----------|--------|
| 21 | **Phone verification (OTP)** | Need SMS provider integration | OTP input component | Large |
| 22 | **Social login (Google/Apple)** | Need OAuth provider setup | Need NextAuth or custom OAuth flow | Large |
| 23 | **Property price history** | Need PriceHistory model | Price trend chart on detail page | Medium |
| 24 | **Blog / area guides** | Need CMS or blog model | Blog listing + detail pages | Large |
| 25 | **Off-plan projects page** | Need filter or flag | Dedicated page + developer partnerships | Medium |
| 26 | **Short-term rentals** | Need rental type filter | Dedicated listing flow | Medium |
| 27 | **Agent availability calendar** | Need Availability model | Calendar UI on agent profile | Medium |
| 28 | **Bulk property import** | CSV/Excel upload + parsing endpoint | Import UI in agent dashboard | Medium |
| 29 | **Property floor plans** | Need floorPlanImages field | Floor plan gallery section | Small |
| 30 | **Virtual tour support** | Need virtualTourUrl field | 360° viewer embed | Small |
| 31 | **Agent license verification** | — | RERA license badge + verification status | Small |
| 32 | **Contact / About / Careers pages** | — | Static pages | Small |
| 33 | **Terms of Service / Privacy Policy** | — | Legal pages | Small |
| 34 | **Agent list page** | GET `/agents` endpoint needed | `/agents` page with agent cards | Medium |
| 35 | **Breadcrumbs** | — | Reusable breadcrumb component | Small |
| 36 | **Reusable pagination component** | — | Extract from buy/rent pages | Small |
| 37 | **Property flags / reports** | Need Report model + endpoint | Report button on property detail | Small |
| 38 | **Search analytics** | Need SearchLog model | Track what users search for | Medium |
| 39 | **Admin audit logging** | Need AuditLog model | Audit log viewer in admin | Medium |
| 40 | **User avatar upload** | Need avatarUrl update endpoint | Avatar component + upload | Small |

### P3 — Infrastructure & Quality

| # | Feature | Details | Effort |
|---|---------|---------|--------|
| 41 | **Test suite (backend)** | Zero tests exist. Add Jest/Vitest for services + controllers | Large |
| 42 | **Test suite (frontend)** | Playwright is a devDep but no tests. Add E2E tests for critical flows | Large |
| 43 | **Listing expiry cron** | Property.expiresAt exists but never checked. Need scheduled job | Small |
| 44 | **Subscription renewal cron** | Check for expired subscriptions, update status | Small |
| 45 | **Token cleanup cron** | Remove expired RefreshToken records from DB | Small |
| 46 | **Complete OpenAPI docs** | ~60% of endpoints documented. Missing agents, viewings, payments, uploads | Medium |
| 47 | **Request ID / correlation ID** | No way to trace requests across logs | Small |
| 48 | **API versioning** | No `/v1/` prefix | Small |
| 49 | **Upload content-type detection** | serveFile() hardcodes image/jpeg for all files | Small |
| 50 | **Lead credits enforcement** | Agent.leadCredits exists but never decremented on lead view | Small |
| 51 | **Property sub-community search filter** | subCommunityId exists but not in search filters | Small |
| 52 | **Multi-language property data** | No support for Arabic + English titles/descriptions | Large |
| 53 | **PR schema for Vercel frontend deploys** | CI/CD only covers API (Railway) | Small |
| 54 | **Move root-level AWS SDK deps** | @aws-sdk/* in root package.json should be in apps/api only | Small |

---

## PART 4: Recommended Implementation Order

### Phase 1 — Quick Wins (1-2 days)

These are small-effort fixes that complete existing features:

1. Wire property delete button (add confirmation dialog + API call)
2. Create property edit page (`/agent/properties/[id]/edit`)
3. Add image upload to property creation form
4. Send password reset email via Resend
5. Enable dynamic sitemap
6. Add saved search creation button on search page
7. Add error toasts for favorites, leads, viewings failures
8. Wire agent property status management (SOLD/RENTED/EXPIRED)
9. Add input sanitization on user-submitted text
10. Fix upload content-type detection

### Phase 2 — Core Missing Features (1-2 weeks)

These are the features that differentiate a real estate platform:

1. **Map-based search** — Integrate Mapbox or Google Maps, add cluster markers, radius search
2. **Email verification flow** — Verification email on register, verify endpoint, isVerified update
3. **Dark mode** — Configure next-themes ThemeProvider, add toggle in header
4. **Notification system** — In-app notifications for leads, viewings, payments, favorites
5. **Saved search email alerts** — Cron job to check new listings against saved searches, send emails
6. **Viewing deposit payments** — Wire the existing schema to actual Stripe checkout flow
7. **Agent reviews** — Review model, CRUD endpoints, star rating UI

### Phase 3 — Advanced Features (2-4 weeks)

These require significant new models and UI:

1. **Real-time chat/messaging** — WebSocket or polling, message model, chat UI
2. **Mortgage calculator** — Client-side widget
3. **Property comparison** — Side-by-side comparison page
4. **Agency management** — CRUD API + admin UI
5. **Agent availability calendar** — Availability model + calendar UI
6. **Phone verification (OTP)** — SMS provider, OTP component

### Phase 4 — Quality & Scale (ongoing)

1. **Test suite** — Backend (Jest/Vitest) + Frontend (Playwright E2E)
2. **Cron jobs** — Listing expiry, subscription renewal, token cleanup, saved search alerts
3. **API versioning** — Migrate to `/v1/` prefix
4. **Search analytics** — Track search queries for insights
5. **Admin audit logging** — Track admin actions
6. **Blog / content** — CMS or blog model for area guides
7. **Mobile PWA** — Service worker, offline support, install prompt

---

## PART 5: Architecture Observations

### Strengths

- **Schema-first design** — Zod schemas at the API boundary ensure consistent validation across frontend/backend
- **Clean module separation** — Each feature (auth, properties, agents, leads, etc.) is a self-contained module with controller/service/routes
- **Full i18n** — Complete bilingual support with RTL, which is complex to retrofit later
- **Payment infrastructure** — Stripe integration is solid with webhook security, idempotency, and mock fallback
- **Security** — Helmet, CORS, rate limiting, httpOnly cookies, JWT refresh rotation

### Weaknesses

- **No test suite** — Zero test files despite Playwright being a devDep
- **No cron/scheduled tasks** — Listing expiry, token cleanup, subscription renewal, saved search alerts all need cron
- **Hardcoded locale in emails** — All emails default to Arabic instead of user preference
- **`@repo/ui` is unused boilerplate** — All UI lives in `apps/web/components/ui` (shadcn)
- **Root-level AWS SDK deps** — Should be in `apps/api/package.json`
- **No input sanitization** — User-generated content (descriptions, messages) not sanitized against XSS
- **Silent error swallowing** — Many frontend API calls catch errors but don't show user feedback
- **No request tracing** — No correlation IDs for debugging across services

---

*Generated: 2026-07-16*
