# PawTaker — Location Gate & Nearby Search
## Feature Overview for Product & Leadership

---

## What This Feature Does

This feature solves two connected problems:

1. **Location Gate** — prevents users from posting a care request or availability profile if they haven't saved their location yet. Instead of a hard block on registration, we enforce it lazily at the moment it actually matters.

2. **Nearby Search** — the Search tab now shows real takers and real care requests sorted by distance from the current user, with a radius filter they can adjust.

---

## Why We Built It This Way

Most users sign up with just a city name in their profile. Without coordinates (latitude + longitude), it is impossible to calculate who is near whom. We had two options:

- **Force every user to set their location on sign-up** — adds friction at the most sensitive moment and would likely hurt conversion.
- **Enforce lazily when it matters** — let users explore the app freely, then prompt them only when they try to do something that requires location (posting a request or availability).

We chose the lazy approach. It is lower friction and targets only the users who actually need it.

---

## Screen-by-Screen Walkthrough

### 1. Post Care Request (`Post Request` screen)

When a user taps **Post Care Request**:

- The app checks silently whether their profile has coordinates saved.
- **If yes** → the wizard opens normally and they can post their request.
- **If no** → a toast notification appears at the bottom of the screen saying *"Please update your location before posting."* and the app navigates them directly to **Edit Profile**, where they can type their city. Once they save, the gate unlocks immediately and they can go back and post.

The user never sees a hard error screen — it is a gentle redirect with a clear message.

---

### 2. Post Availability (`Post Availability` screen)

Identical behaviour to Post Care Request. The same gate fires on mount. Takers who haven't set their city will be prompted to do so before they can publish their availability profile.

---

### 3. Edit Profile (`Edit Profile` → Details tab)

This is where the location unlocks. The user types their city name (e.g. *Douala*, *Paris*, *Lagos*) in the location field and taps Save.

Behind the scenes:
- The app calls the **OpenStreetMap Nominatim API** (free, no API key, works worldwide) to convert the city name into exact coordinates (latitude + longitude).
- Those coordinates are saved to the user's record in the database alongside the city name.
- The auth store is updated immediately so the gate is unlocked right away — no app restart needed.

If the geocoding fails (e.g. the city name is too vague or misspelled), the city name is still saved but the gate will fire again next time they try to post. The user will see a console warning in dev — a user-facing error message for this case can be added later.

---

### 4. Search Tab (`Search` screen)

The Search screen is now fully functional. Here is what the user sees:

**If they have no location saved:**
A prompt card is shown with a message explaining they need to set their location, and a button that takes them directly to Edit Profile.

**If they have a location saved:**

- A **mode toggle** at the top lets them switch between two views:
  - **Takers** — people available to look after pets near them
  - **Requests** — open care requests posted near them

- A **radius selector** with four options:
  | Label | Distance | Best for |
  |-------|----------|----------|
  | Nearby | 10 km | Dense city centers |
  | Close | 25 km | Mid-range urban |
  | Wide | 50 km | Default — covers most cities |
  | Anywhere | 150 km | Rural areas or sparse results |

- Results appear as **cards** showing the person or pet's photo, name, city, and a **distance badge** (e.g. *3.2 km away*).

- For **Requests**, each card also shows the pet's name, species, care type, dates, and points offered.

- If the search returns no results, a hint appears suggesting the user try a wider radius.

The results are always **sorted nearest first** so the most relevant options appear at the top.

---

## How Distances Are Calculated

We use the **Haversine formula** — a standard mathematical formula for calculating the real-world distance between two points on the Earth's surface. This runs directly inside the database (Postgres), so the heavy calculation stays server-side and the app only receives the final sorted list.

This is fast, accurate to within metres at practical distances, and requires no third-party geolocation service.

---

## Data Flow Summary

```
User types "Douala" → Save pressed
      ↓
App calls OpenStreetMap API → gets lat: 4.061, lng: 9.768
      ↓
Saves city + latitude + longitude to users table
      ↓
Auth store refreshed → location gate unlocked instantly

─────────────────────────────────────────────────

User opens Search tab → has location
      ↓
App sends: my lat/lng + chosen radius to database
      ↓
Database runs distance formula on all takers / requests
      ↓
Returns list sorted by distance (nearest first)
      ↓
App renders cards with distance badges
```

---

## Existing Users — Automatic Backfill

Some users already saved a city name before coordinates were introduced. Without a fix, those users would hit the location gate every time they tried to post, even though they had already entered their city — a confusing and unfair experience.

To handle this silently, the app runs a **one-time background backfill** when an existing user logs in:

1. When the app loads, it checks: does this profile have a city but no coordinates?
2. If yes, it geocodes the city name automatically in the background.
3. The coordinates are saved to the database and the auth store is updated.
4. The whole process is invisible to the user — no loading screen, no prompt, no interruption.

From the next tap on Post Request or Post Availability, the gate will pass them through without any issues.

If geocoding fails (e.g. their saved city name is too vague), the backfill silently skips. They will see the gate once, type their city again at that point, and it will resolve normally.

---

## What Was Not Changed

- No changes to the sign-up or onboarding flow.
- No changes to how existing users are stored.
- Users who already have a city saved but no coordinates will simply see the gate once the next time they try to post — they are not forced to do anything until that moment.
- The points system, chat, agreements, and all other features are untouched.

---

## External Services Used

| Service | Purpose | Cost | API Key Required |
|---------|---------|------|-----------------|
| OpenStreetMap Nominatim | City name → coordinates | Free | No |
| Supabase (existing) | Store coordinates, run distance queries | Existing plan | Existing key |

No new paid services were introduced.
