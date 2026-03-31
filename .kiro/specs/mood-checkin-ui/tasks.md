# Tasks: Mood Check-In UI

## Task List

- [x] 1. Add mood check-in widget to HomeSection.js
  - [x] 1.1 Import `logMood` and `getTodayMoods` from `../../api/auth` in HomeSection.js
  - [x] 1.2 Add `todayLogs` state (array, default `[]`) and `fetchTodayLogs` callback using `getTodayMoods`
  - [x] 1.3 Call `fetchTodayLogs` on mount and add it to the existing 15-second polling interval
  - [x] 1.4 Define `SLOTS`, `SCORE_LABELS`, `SCORE_EMOJIS` constants and `getCurrentSlot()` helper inside the component file
  - [x] 1.5 Add check-in form state: `activeSlot`, `score`, `note`, `submitting`, `checkinError`

- [x] 2. Render slot pills
  - [x] 2.1 Render a "How are you feeling?" widget section between the hero and pillars sections
  - [x] 2.2 Map over `SLOTS` to render three pill buttons; disable pills where `isSlotDone(slot, todayLogs)` is true
  - [x] 2.3 Highlight the current-time slot pill as suggested (border/background accent)
  - [x] 2.4 Show a ✓ checkmark and the logged score emoji on completed slot pills

- [x] 3. Render inline check-in form
  - [x] 3.1 When `activeSlot` is set, render the inline form below the pills
  - [x] 3.2 Render five score buttons (1–5) with emoji + label; highlight the selected score
  - [x] 3.3 Render an optional note `<textarea>` or `<input>` (placeholder: "Add a note… (optional)")
  - [x] 3.4 Render the "Log Mood" submit button; disable it when `score` is null or `submitting` is true
  - [x] 3.5 Show `checkinError` message inline below the form when set

- [x] 4. Implement submission handler
  - [x] 4.1 On submit, call `logMood({ score, label: SCORE_LABELS[score], slot: activeSlot, note })`
  - [x] 4.2 On 201 success: call `fetchTodayLogs()`, reset `activeSlot` to null, clear form state
  - [x] 4.3 On 409 error: set `checkinError` to "Already logged for this slot today." and call `fetchTodayLogs()`
  - [x] 4.4 On other errors: set `checkinError` to "Something went wrong. Try again."
  - [x] 4.5 Always reset `submitting` to false in the finally block

- [x] 5. Verify health card integration
  - [x] 5.1 Manually verify that after logging a mood, navigating to the Health Card section shows the new data point in the MoodChart
  - [x] 5.2 Confirm the "No mood logs yet" empty state in CardSection.js is replaced by chart data after first check-in
