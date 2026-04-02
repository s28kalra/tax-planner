# DB + Auth Plan — Indian Tax Planner

## What We're Adding

1. **Neon PostgreSQL** — cloud serverless Postgres via Drizzle ORM
2. **Auth.js v5 (NextAuth)** — email/password + Google OAuth login
3. **Server-side persistence** — income, deductions, selected regime, tax results saved per user
4. **User dashboard** — landing page shows all past analyses, grouped by financial year
5. **Seamless sync** — anonymous users keep using localStorage; logged-in users auto-sync to DB

---

## New Tech Stack Additions

| Package | Purpose |
|---|---|
| `next-auth@5` (beta) | Auth — sessions, JWT, providers |
| `@auth/drizzle-adapter` | NextAuth adapter for Drizzle/Neon |
| `drizzle-orm` | Type-safe SQL ORM |
| `drizzle-kit` | Schema migrations CLI |
| `@neondatabase/serverless` | Neon's HTTP-based Postgres driver |
| `bcryptjs` + `@types/bcryptjs` | Password hashing for Credentials provider |
| `@radix-ui/react-avatar` | Avatar component in header |

---

## Database Schema

```sql
-- NextAuth required tables (managed by @auth/drizzle-adapter):
users, accounts, sessions, verification_tokens

-- Custom table:
CREATE TABLE tax_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  financial_year TEXT      NOT NULL,          -- "2025-26"
  income       JSONB       NOT NULL,          -- IncomeBreakdown
  deductions   JSONB,                         -- DeductionInput (after checklist)
  selected_regime TEXT,                       -- "new" | "old" | null (not yet decided)
  new_regime_result  JSONB,                   -- TaxCalculationResult
  old_regime_result  JSONB,                   -- TaxCalculationResult
  old_with_deductions_result JSONB,           -- TaxCalculationResult (after deductions)
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

Each user can have **multiple sessions** per financial year (e.g., if they update income mid-year). The latest session per FY is what shows on the dashboard.

---

## New File Structure

```
Tax Planner/
├── lib/
│   ├── db/
│   │   ├── schema.ts        ← Drizzle table definitions
│   │   ├── index.ts         ← Neon connection + Drizzle instance export
│   │   └── migrations/      ← Generated SQL (drizzle-kit)
│   ├── auth.ts              ← NextAuth v5 config (providers, adapter, callbacks)
│   └── auth-actions.ts      ← Server Actions: register, login helpers
│
├── app/
│   ├── auth/
│   │   ├── login/page.tsx   ← Login page
│   │   └── register/page.tsx ← Register page
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   ← NextAuth handler
│   │   └── sessions/
│   │       ├── route.ts      ← GET (list user's sessions), POST (create/update)
│   │       └── [id]/route.ts ← GET, DELETE single session
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── user-menu.tsx     ← Avatar dropdown in header (name, logout)
│   └── sessions-history.tsx  ← Past analyses cards on landing page
```

---

## UX Changes Per Page

### Header (`app/layout.tsx`)
- **Logged out**: shows "Sign In" button (right side)
- **Logged in**: shows user avatar + name + dropdown (Profile, Sign Out)
- "No Login Required" feature card on landing is replaced/updated to reflect auth is now optional but adds persistence

### Landing Page (`app/page.tsx`)
- **Logged out**: works exactly as before (localStorage session)
- **Logged in**:
  - Welcome: "Welcome back, [Name]"
  - **Past Analyses** section — cards grouped by FY:
    - Shows gross income, tax saved (new vs old), recommended regime, date
    - "Load" button → loads that session into store → goes to analysis
    - "New Analysis" button → resets and goes to income form
  - Still shows FY selector for new analysis

### Income Page (`app/income/page.tsx`)
- No visual change
- On submit: if logged in → `POST /api/sessions` to create/update session in DB
- Session ID stored in Zustand store for subsequent updates

### Analysis Page (`app/analysis/page.tsx`)
- No visual change
- Once results are computed: `PUT /api/sessions/[id]` to save results to DB
- After deductions confirmed: update session with deductions + final result

### Summary Page (`app/summary/page.tsx`)
- No change — PDF export still works the same

---

## Data Flow (Logged-in User)

```
User enters income → submit → POST /api/sessions → DB row created (session_id returned)
                                                           ↓
                     Analysis runs → results computed → PUT /api/sessions/[id]
                                                           ↓
                     Deductions confirmed → PUT /api/sessions/[id] (update deductions)
                                                           ↓
                     User visits landing page → GET /api/sessions → shows history
```

---

## Auth Flow

### Register
1. `/auth/register` — name, email, password form
2. Server action hashes password with `bcryptjs`, inserts into `users` table
3. Auto sign-in after registration → redirect to landing

### Login
- `/auth/login` — email + password (Credentials provider)
- Google OAuth button (if `GOOGLE_CLIENT_ID` env var is set)
- On success → redirect to landing (shows history)

### Logout
- `UserMenu` dropdown → "Sign Out" → `signOut()` → redirect to `/`

### Route Protection
- `/auth/*` pages are public
- All `/api/sessions/*` routes check `auth()` and return 401 if not logged in
- Frontend income/analysis pages: no hard redirect (still work anonymously), but show "Save to account" prompt if not logged in

---

## Zustand Store Changes (`store/tax-store.ts`)

Add to store state:
```ts
currentSessionId: string | null   // DB session ID once saved
```

Add actions:
```ts
setCurrentSessionId: (id: string | null) => void
```

The `currentSessionId` is **not** persisted to localStorage (transient per browser session).

---

## Environment Variables

Add to `.env.local`:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...          # optional
GOOGLE_CLIENT_SECRET=...      # optional
```

---

## Build Order

1. Install packages
2. `lib/db/schema.ts` — Drizzle schema (NextAuth tables + `tax_sessions`)
3. `lib/db/index.ts` — Neon + Drizzle instance
4. `lib/auth.ts` — NextAuth v5 config
5. `app/api/auth/[...nextauth]/route.ts`
6. Run `npx drizzle-kit push` → creates tables in Neon
7. `components/auth/login-form.tsx` + `register-form.tsx` + `user-menu.tsx`
8. `app/auth/login/page.tsx` + `app/auth/register/page.tsx`
9. Update `app/layout.tsx` — add `SessionProvider` wrapper + `UserMenu` in header
10. `app/api/sessions/route.ts` + `app/api/sessions/[id]/route.ts`
11. `components/sessions-history.tsx`
12. Update `app/page.tsx` — sessions history for logged-in users
13. Update `store/tax-store.ts` — add `currentSessionId`
14. Update `app/income/page.tsx` — save to DB on submit
15. Update `app/analysis/page.tsx` — save/update results in DB

---

## What Stays the Same

- All tax math (TypeScript calculators) — untouched
- All Claude AI integration — untouched
- All existing components (tax-comparison, deduction-checklist, ai-chat, etc.) — untouched
- Anonymous usage still fully works — localStorage persists as before
- No breaking changes to existing routes

---

## Before Implementation — You Need

1. **Neon account** — free tier at [neon.tech](https://neon.tech), create a project, copy `DATABASE_URL`
2. **Google OAuth** (optional) — Google Cloud Console → OAuth 2.0 client
3. Generate `NEXTAUTH_SECRET`: run `openssl rand -base64 32` in terminal
