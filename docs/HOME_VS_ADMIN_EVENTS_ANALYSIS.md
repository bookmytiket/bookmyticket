# Home Page vs Admin Page — Events List Analysis

## 1. Data sources

| Source | Where it lives | Used by |
|--------|----------------|--------|
| **HOME_EVENTS** | `app/data/homeEvents.js` (static array, 15 items) | Home page, Admin page, FeaturedEvents, Spotlight, etc. |
| **organiser_events** | `localStorage` key `organiser_events` | Home page (as `newOrgEvents`), Admin page (as `events`) |

---

## 2. Home page events list

### Combined list (for category filter)

- **Variable:** `allEventsForFilter`
- **Formula:** `HOME_EVENTS` + `newOrgEvents`
- **Where:** `app/page.js` (useMemo, depends on `newOrgEvents`)
- **`newOrgEvents`:** Loaded from `localStorage.getItem("organiser_events")` on mount and on window focus.

### Category-filtered list

- **Variable:** `filteredEvents`
- **When:** Only when user selects a category in the 2nd navbar (`?category=...`).
- **Logic:** `allEventsForFilter.filter(ev => eventMatchesCategory(ev, cat))` using `app/utils/categoryMatch.js`.
- **Rendered:** In the “Filter by category” block as a grid of `TicketCard`s. If no category selected, this block shows nothing (filtered list is empty).

### Other home sections (not using organiser events)

- **Featured Events:** `FeaturedEvents` component uses `HOME_EVENTS.filter(e => e.featured)` (imports from `homeEvents.js`). Does **not** include organiser events.
- **Spotlight:** `HOME_EVENTS.filter(e => e.spotlight)` (in `page.js`). Does **not** include organiser events.
- **Newly Published by Organisers:** Uses only `newOrgEvents` (organiser events from localStorage), rendered in a separate section when `newOrgEvents.length > 0`.

### Summary (Home)

- **Single combined list:** Only for the category filter: `HOME_EVENTS` + organiser events.
- **Featured / Spotlight / etc.:** Use only `HOME_EVENTS` (no organiser events).
- **Organiser events:** Shown in “Newly Published” and inside the category-filtered list.

---

## 3. Admin page events list

### Combined list

- **Variable:** `allEvents`
- **Formula:**
  - **Home:** `HOME_EVENTS` minus events whose `id` is in `archivedHomeIds`.
  - **Organiser:** `events` from state, minus events with `archived: true`.
  - Each item is tagged with `source: "home"` or `source: "organiser"`.
- **`events`:** Loaded from `localStorage.getItem("organiser_events")` on mount; admin also writes back with `setEvents` (e.g. archive, featured toggle).

### Where `allEvents` is used in Admin

- **Operations → Events tab:** Table of all events (title, venue, date, category, source, status, actions). Actions: Edit (placeholder), Archive, Cancel (organiser only).
- **Dashboard:** “TOTAL EVENTS” = `allEvents.length`; category bar chart and “Paid %” derived from `allEvents`.
- **Event Categories:** “Total Events” per category = count of `allEvents` matching that category via `eventMatchesCategory`.
- **SEO & Meta → Event-Specific Meta Ads:** Table of all events for meta keywords/ads ID; uses `allEvents`.

### Archive behaviour

- **Home events:** Archiving adds the event `id` to `archivedHomeIds` (persisted in `admin_archived_home_ids`). They are then excluded from `allEvents`.
- **Organiser events:** Archiving sets `archived: true` on the event and syncs to `organiser_events` in localStorage; those events are excluded from `allEvents`.

---

## 4. Alignment and differences

| Aspect | Home page | Admin page |
|--------|-----------|------------|
| **Home events** | `HOME_EVENTS` (no archive on home) | `HOME_EVENTS` minus `archivedHomeIds` |
| **Organiser events** | From `organiser_events` localStorage | Same; admin can archive (persisted to same key) |
| **Combined list** | `allEventsForFilter` = home + organiser | `allEvents` = non-archived home + non-archived organiser |
| **Category match** | `eventMatchesCategory` (shared util) | Same |
| **Featured / Spotlight** | Use only `HOME_EVENTS` | N/A (admin doesn’t show those sections) |

So:

- **Same data source for organiser events:** Both use `organiser_events` in localStorage.
- **Same static home data:** Both use `HOME_EVENTS` from `homeEvents.js`.
- **Archive only in admin:** Home page does not apply archive; it shows all of `HOME_EVENTS` and all organiser events in the combined/category list. Admin hides archived home IDs and archived organiser events in `allEvents`.

---

## 5. Possible improvements

1. **Featured / Spotlight on home:** If organiser events should appear in “Featured Events” or “Spotlight,” those components would need to accept a combined list (e.g. home + organiser) and filter by `featured` / `spotlight` (and organiser events would need those flags when created).
2. **Single source of truth:** Right now home “combined” list is built in `page.js` and admin “combined” list in `admin/page.js`. Logic is duplicated; a small shared hook or util could return “all non-archived events” for both.
3. **Edit organiser event:** Admin “Edit” on organiser events is not wired; it could navigate to organiser panel with the event id or open an edit form.

---

## 6. File reference

- **Home events data:** `app/data/homeEvents.js` — `HOME_EVENTS`
- **Home page list logic:** `app/page.js` — `allEventsForFilter`, `filteredEvents`, `newOrgEvents`
- **Admin list logic:** `app/admin/page.js` — `events`, `archivedHomeIds`, `allEvents` (useMemo)
- **Category matching:** `app/utils/categoryMatch.js` — `eventMatchesCategory`
- **Persistence:** `localStorage`: `organiser_events`, `admin_archived_home_ids`
