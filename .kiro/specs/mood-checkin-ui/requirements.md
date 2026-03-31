# Requirements: Mood Check-In UI

## Overview

HomeSection.js has no mood check-in UI, so the health card's mood trend chart is always empty. This spec adds a daily mood check-in widget to HomeSection.js that lets users log their mood for each of the three daily slots (morning, afternoon, evening) using the existing backend and API client.

---

## Requirements

### Requirement 1: Mood Check-In Widget in HomeSection

**User Story**: As a user, I want to log my mood directly from the home page so that my health card's mood trend chart reflects my daily emotional state.

#### Acceptance Criteria

1.1 The mood check-in widget MUST render inside HomeSection.js, positioned between the hero section and the pillars section.

1.2 The widget MUST display exactly three slot pills: Morning (🌅), Afternoon (☀️), and Evening (🌙).

1.3 The widget MUST call `getTodayMoods()` on mount and re-fetch every 15 seconds to keep slot states in sync.

1.4 A slot pill for a slot that has already been logged today MUST be visually disabled (reduced opacity, `cursor: not-allowed`) and non-interactive.

1.5 The slot corresponding to the current time of day MUST be visually highlighted as the suggested slot:
- Hours 5–11 → Morning
- Hours 12–17 → Afternoon
- Hours 18–23 and 0–4 → Evening

1.6 Clicking an available slot pill MUST expand an inline check-in form below the pills (no modal). Clicking the same pill again MUST collapse the form.

---

### Requirement 2: Check-In Form

**User Story**: As a user, I want to select a mood score and optionally add a note so that my log is meaningful and useful for trend analysis.

#### Acceptance Criteria

2.1 The inline form MUST display five score buttons, one for each score value 1–5, each showing the corresponding emoji and label:
- 1 → 😞 Very Low
- 2 → 😔 Low
- 3 → 😐 Okay
- 4 → 🙂 Good
- 5 → 😄 Great

2.2 The selected score button MUST be visually highlighted (distinct background/border) to confirm selection.

2.3 The form MUST include an optional text input for a short note (placeholder: "Add a note… (optional)").

2.4 The "Log Mood" submit button MUST be disabled until a score is selected.

2.5 While a submission is in progress, the submit button MUST show a loading state ("Logging…") and be disabled to prevent double-submission.

---

### Requirement 3: Submission and State Update

**User Story**: As a user, I want my mood submission to be confirmed immediately and the slot to be marked as done so I know it was recorded.

#### Acceptance Criteria

3.1 On submit, the widget MUST call `logMood({ score, label, slot, note })` where `label` is derived from the score using the mapping in Requirement 2.1.

3.2 On a successful (201) response, the widget MUST:
- Re-fetch today's logs via `getTodayMoods()`
- Close the inline form
- Mark the submitted slot pill as done (disabled with a ✓ indicator)

3.3 On a 409 response (slot already logged), the widget MUST:
- Display an inline error message: "Already logged for this slot today."
- Re-fetch today's logs to sync the disabled state
- Keep the form open so the user can see the error

3.4 On any other error, the widget MUST display an inline error message: "Something went wrong. Try again." and keep the form open.

3.5 The `submitting` state MUST always reset to `false` after the API call completes (success or error).

---

### Requirement 4: Slot Detection Logic

**User Story**: As a user, I want the app to know which time slot I'm in so the right pill is highlighted without me having to figure it out.

#### Acceptance Criteria

4.1 The `getCurrentSlot()` function MUST return:
- `'morning'` for hours 5–11 (inclusive)
- `'afternoon'` for hours 12–17 (inclusive)
- `'evening'` for hours 18–23 and 0–4 (midnight maps to evening)

4.2 The current slot MUST be determined client-side using `new Date().getHours()`.

---

### Requirement 5: Styling and Compatibility

**User Story**: As a user, I want the check-in widget to look like it belongs in the app so the experience feels cohesive.

#### Acceptance Criteria

5.1 The widget MUST use only inline styles and/or existing CSS classes from `index.css`. No external UI libraries may be introduced.

5.2 All colors and spacing MUST use the existing CSS variables: `var(--surface)`, `var(--border)`, `var(--border-strong)`, `var(--text-muted)`, `var(--text-dim)`, `var(--transition)`, `var(--radius)`, `var(--radius-sm)`.

5.3 The widget MUST be responsive — slot pills MUST wrap on narrow screens using `flex-wrap: wrap`.

---

## Correctness Properties

### Property 1: Slot pill count is always exactly 3

For any render of the mood check-in widget, the number of slot pills rendered equals 3.

```
∀ render: count(slot_pills) = 3
```

### Property 2: Disabled pills match today's logged slots

For any `todayLogs` array, a slot pill is disabled if and only if `todayLogs` contains an entry with that slot value.

```
∀ slot ∈ { morning, afternoon, evening }:
  pill(slot).disabled ⟺ ∃ log ∈ todayLogs where log.slot = slot
```

### Property 3: getCurrentSlot covers all 24 hours

For every hour h ∈ [0, 23], `getCurrentSlot(h)` returns a value in `{ morning, afternoon, evening }` with no gaps or overlaps.

```
∀ h ∈ [0, 23]: getCurrentSlot(h) ∈ { 'morning', 'afternoon', 'evening' }
```

### Property 4: Score label mapping is total and correct

For every score s ∈ [1, 5], `SCORE_LABELS[s]` is defined and non-empty.

```
∀ s ∈ { 1, 2, 3, 4, 5 }: SCORE_LABELS[s] ≠ undefined ∧ SCORE_LABELS[s].length > 0
```

### Property 5: Submit button gating

The submit button is enabled if and only if a score is selected and the form is not currently submitting.

```
submitButton.enabled ⟺ score ≠ null ∧ submitting = false
```
