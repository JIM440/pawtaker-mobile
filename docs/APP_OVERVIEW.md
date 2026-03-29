# PawTaker app overview

This document explains what the PawTaker mobile app is, who it serves, and how the major parts work together.

PawTaker is a mobile platform that connects pet owners who need care with caregivers ("takers") who can provide it. The app supports the full journey: onboarding, discovery, posting requests/availability, messaging, agreements, reviews, and notifications.

---

## Product summary

PawTaker is a two-sided pet-care marketplace app built with Expo React Native and Supabase. It helps users:

- Find care opportunities or care providers
- Coordinate details through in-app chat
- Formalize care through agreements/contracts
- Build trust via KYC, profile transparency, and reviews

---

## Who uses the app

### 1) Pet owners

Pet owners can:

- Create and manage pet profiles
- Post care requests (with dates, times, needs)
- Browse available takers
- Chat with potential caregivers
- Review caregivers after completed care

### 2) Caregivers (takers)

Takers can:

- Publish their availability and care preferences
- Discover care requests
- Receive and respond through chat
- Accept agreements and complete care workflows
- Build reputation through ratings and reviews

---

## Core user journeys

## 1. Authentication and onboarding

Users go through onboarding, authentication, verification, and profile setup before entering the private app area.

## 2. Discovery and matching

In the Home area, users can browse care requests and takers, use search/filters, and initiate engagement.

## 3. Posting

Users can launch:

- A care request (owner side)
- An availability profile (taker side)

Both are guided as structured flows with validation and preview-like steps.

## 4. Messaging

Once two users engage, they communicate in one-to-one threads with realtime updates, unread states, and attachment support (photos/documents/camera).

## 5. Agreement and completion

Care can move into a contract/agreement stage, then into completion and review.

## 6. Trust and retention

KYC checks, reviews, notifications, and points/transaction history help establish trust and keep users active.

---

## Main app sections

The main private experience is tab-based:

- **Home**: discovery feed, search/filter, notifications entry
- **My Care**: care management (given/received/liked), active care context
- **Post**: quick entry point for posting requests/availability
- **Messages**: conversations and thread list
- **Profile**: personal profile, pets, settings, and public profile views

Outside tabs, there are dedicated full-screen stacks for:

- KYC flow
- Pet create/edit/detail
- Post request flow
- Post availability flow
- Offer/contract-related screens

---

## Main feature modules

### Profile and identity

- User profile data (name, avatar, bio, location, preferences)
- Public profile viewing
- Edit/settings and account-level preferences

### Pets

- Create/read/update pet records
- Rich pet metadata used in matching and request context

### Care requests and availability

- Owner demand-side posting
- Taker supply-side posting
- Data feeds into discovery and matchmaking

### Messaging

- Realtime thread list and conversation messages
- Unread counts and sender-aware previews
- Message types include standard text and media/file-linked messages

### Contracts and reviews

- Agreement lifecycle represented through contract records
- Post-care feedback and rating system

### Notifications

- In-app notification list
- Push token registration and server-triggered push dispatch

### KYC and safety

- Submission flow for identity verification artifacts
- KYC status can gate certain actions (posting/applying)
- User blocking/report-related entities support moderation and trust

---

## Data model at a glance

Core entities include:

- `users`
- `pets`
- `care_requests`
- `threads`
- `messages`
- `contracts`
- `reviews`
- `notifications`
- `push_tokens`

Supporting entities include likes, check-ins, points transactions, KYC submissions, user blocks, reports, and taker profiles.

For detailed schema-level properties, see `docs/ENTITIES_AND_PROPERTIES.md`.

---

## Technical stack and integrations

### Frontend

- Expo + React Native
- Expo Router (file-based routing)
- TypeScript

### Backend and data

- Supabase Auth + Postgres + Realtime
- Typed Supabase schema mappings in app code

### Media

- Cloudinary upload integration (image and raw/file flows)

### Auth providers

- Email/password auth
- Google sign-in integration

### Notifications

- Expo push token registration
- Supabase function(s) for push dispatch

---

## Trust, quality, and operational patterns

- Route-level auth separation between public and private app shells
- KYC checks before sensitive actions
- Structured posting and agreement flows to reduce ambiguity
- Localized UI content through i18n locale files
- Realtime refresh for message-centric workflows

---

## Related docs

- `docs/APP_STRUCTURE_AND_ROUTES.md` for route-level architecture
- `docs/ENTITIES_AND_PROPERTIES.md` for table/entity properties

