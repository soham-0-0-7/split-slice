<div align="center">

# Split Slice

Dark, minimalist group expense splitter with optimized settlements, friend requests, and rich group views — built on Next.js App Router + MongoDB.

</div>

## Table of Contents

- Overview
- Features
- Screens and Flows
- Tech Stack
- Architecture & Design Patterns
- Data Models
- API Endpoints
- Environment & Setup
- Run and Develop
- Postman Collection (optional)
- Notes & Roadmap

---

## Overview

Split Slice makes splitting group expenses effortless. Create groups with friends, add expenses (with categories), and let the app compute optimized settlements. The interface uses a monochrome dark theme with subtle animations and a glitch-brand effect.

Key ideas:

- App Router-first Next.js app with serverless API routes
- MongoDB + Mongoose models with auto-increment ids
- Optimized settlement algorithm applied on expense creation
- Clean UX: group totals, personal totals, per-member balances, and “your settlements” view

## Features

- Authentication

  - Signup/Login with JWT, token stored client-side
  - Header hidden automatically on /login and /signup

- Friends & Requests

  - Send friend requests, accept/reject, revoke
  - View friends list

- Groups

  - Create a group, add members, toggle owners-only member add
  - Group overview: totals, your share, member count
  - Quick actions: add expense, add members
  - View “Group Settlements” (all members) and “Your Settlements” (viewer scoped)
  - Per-member balances calculated from settlements

- Expenses

  - Create an expense with description, amount, paid-by, and per-member shares
  - New: optional category (food, travel, gifts)
  - Split equally helper, select/clear members, fixed shares per member
  - Delete expense (owner or payer)

- Settlements

  - Compute optimized settlements per group after expense creation
  - List all settlements in group; show viewer-specific settlements tab
  - Mark a settlement as settled (delete by id)
  - Delete all settlements between two users (for a user)

- UI/UX
  - Global dark theme, animated underlines, subtle glows
  - GlitchText branding in header and auth pages (hover-activated)
  - Sticky header, backdrop blur, responsive layouts

## Screens and Flows

- Login (`/login`) and Signup (`/signup`)

  - Compact form UI with animated accents and glitch logo
  - On success, redirect to Dashboard

- Dashboard (`/dashboard`)

  - Auth-guarded: validates token, otherwise redirects to login
  - Animated background gradients (subtle)

- Groups List (`/groups`) and Group Details (`/groups/[groupid]`)

  - Header shows group meta (id, members), group total and your share
  - Tabs: Expenses, Members, Your Settlements
  - Right rail shows Group Settlements and computed Balances

- Create Expense (`/groups/[groupid]/createExp`)

  - Form: amount, description, category (optional), paid by, split between members
  - Helpers: Select All, Clear, Split Equally
  - On submit: creates expense, borrowings, recomputes optimized settlements

- Add Members (`/groups/[groupid]/addMembers`)

  - Conditional: owner-only when ownersAddOnly is true

- Friends (`/friends`, `/friends/requests`)
  - Send/settle/revoke requests, view friend list

## Tech Stack

- Framework: Next.js 15 (App Router)
- UI: React 19, Tailwind CSS 4
- DB/ORM: MongoDB with Mongoose 8
- Auth: JWT (jsonwebtoken, jwt-decode)
- Crypto: bcryptjs
- TypeScript 5

Scripts (package.json):

- `npm run dev` – start dev server
- `npm run build` – build
- `npm run start` – start production server

## Architecture & Design Patterns (selected)

- Three-Tier: UI (app/), API (app/api/), Data (server/models)
- Repository: Mongoose models encapsulate persistence (User, Group, Expense, Borrowing, Settlement, FriendRequest)
- Singleton: Shared Mongo connection and compiled models
- Strategy: Greedy settlement optimization algorithm
- Facade: Expense creation route orchestrates expense, borrowings, and settlements
- Proxy/Middleware: API routes gatekeep access (auth checks), sanitize responses
- Context: Global user state through a UserContext (token, friendlist)
- Observer: React state + effects drive reactive UI updates

## Data Models (Mongoose)

- User (`src/server/models/user.ts`)

  - userid (auto-increment), username, password hash, friendlist: number[]

- Group (`src/server/models/group.ts`)

  - groupid (auto), groupname, owner (userid), members: number[], ownersAddOnly

- Expense (`src/server/models/expense.ts`)

  - eid (auto), paidBy (userid), amount, description?, createdOn, groupId, category?: "food" | "travel" | "gifts"

- Borrowing (`src/server/models/borrowing.ts`)

  - bid (auto), lender (userid), borrower (userid), amount, expenseid, groupId

- Settlement (`src/server/models/settlement.ts`)

  - sid (auto), payee (userid), receiver (userid), amount, groupId?, createdOn

- FriendRequest (`src/server/models/friendRequest.ts`)
  - rid (auto), from (userid), to (userid), createdOn

> Auto-increment ids are powered by a Counter collection.

## API Endpoints (highlight)

Base: `http://localhost:3000`

Auth

- POST `/api/user/signup` – body: { username, password }
- POST `/api/user/login` – body: { username, password } → { token, friendlist }

Users

- GET `/api/users/get/[userid]`
- GET `/api/users/byUsername/[username]`
- POST `/api/users/byIds` – body: { ids: number[] }
- GET `/api/users/friends/[userid]`

Friend Requests

- POST `/api/requests/create` – { fromUsername, toUsername }
- GET `/api/requests/get/[userid]`
- PATCH `/api/requests/settle` – { rid, action: "accept" | "reject" }
- DELETE `/api/requests/revoke` – { fromUsername, toUsername }

Groups

- POST `/api/groups/create` – { groupname, ownerUserid, members: string[], ownersAddOnly? }
- GET `/api/groups/get/[groupid]`
- GET `/api/groups/getMembers/[groupid]`
- GET `/api/groups/getGroups/[userid]`
- POST `/api/groups/addMembers` – { groupId, memberUsernames: string[] }
- GET `/api/groups/groupExpenses/[groupId]` – total for group
- GET `/api/groups/personalExpense/[userid]?groupId=...` – personal total in group

Expenses

- POST `/api/expenses/create` – { groupId, amount, description?, category?, paidByUsername, shares: { username, amount }[] }
- GET `/api/expenses/getExpenses/[groupid]`
- DELETE `/api/expenses/delete/[expenseId]`

Settlements

- GET `/api/settlements/getByUser/[userid]?groupId=...`
- GET `/api/settlements/getByGroup/[groupid]`
- DELETE `/api/settlements/[sid]` – mark a settlement settled
- DELETE `/api/settlements/deleteAll` – { counterpartUserid }
- POST `/api/settlements/optimize` – recompute from debts (admin/advanced)

> Some routes may expect the JWT token via `Authorization: Bearer <token>` when mutating data.

## Environment & Setup

Create `.env` in project root:

```
DATABASE_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=your-strong-secret
```

Install and run (Windows cmd):

```bat
npm install
npm run dev
```

Open http://localhost:3000

## Run and Develop

- Dev server: `npm run dev`
- Build: `npm run build`
- Start (prod): `npm run start`

Project layout (selected):

- `src/app` – pages, layouts, and API routes (App Router)
- `src/app/api/*` – serverless route handlers
- `src/server` – db connection and Mongoose models
- `src/components` – shared UI (Header, GlitchText, group components)

## Notes & Roadmap

- Categories are optional per expense; more categories and filters can be added easily
- Consider adding paging to settlement/expense lists for large groups
- Optional admin scripts can be extracted for one-off maintenance/migrations
- Add unit tests around settlement strategy and API contracts

---

© 2025 Split Slice. Built with Next.js and MongoDB.
