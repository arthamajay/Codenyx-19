# Sahara — Full Codebase Reference Document

> Use this document to understand the entire Sahara project — its architecture, features, data models, API routes, frontend components, and business logic. This is intended to give any AI tool full context to assist with the codebase.

---

## 1. Project Overview

**Sahara** is a full-stack NGO mental health platform for youth. It provides a stepped-care model:

1. **Community** — anonymous posts (like Reddit), users share experiences, react with likes/dislikes, comment
2. **I Need Help** — real-time 1-on-1 chat with trained volunteer mentors via Socket.io
3. **SOS** — crisis support, helpline numbers, live clinic availability
4. **Journal** — private personal diary, only visible to the user
5. **Health Card** — auto-generated mental health profile with distress score, mood trends, session history

**Tech Stack:**
- Frontend: React (Create React App), React Router v7, Axios, Socket.io-client
- Backend: Node.js, Express, Socket.io, Mongoose
- Database: MongoDB Atlas
- Auth: JWT (7-day expiry), bcrypt password hashing

---

## 2. Project Structure

```
MindBridge/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html         # Title: "Sahara — Mental Health Support"
│   └── src/
│       ├── App.js             # Root — role-based routing
│       ├── index.js           # Entry point
│       ├── index.css          # All styles (dark theme design system)
│       ├── api/
│       │   └── auth.js        # All Axios API calls (baseURL: http://localhost:5000/api)
│       ├── context/
│       │   ├── AuthContext.js # User session state (localStorage: mb_session)
│       │   └── SocketContext.js # Socket.io connection (JWT auth)
│       └── components/
│           ├── AuthScreen.js       # Login + Register page
│           ├── Dashboard.js        # User dashboard (navbar + section routing)
│           ├── MentorDashboard.js  # Mentor-specific dashboard
│           ├── AdminDashboard.js   # Admin panel
│           └── sections/
│               ├── HomeSection.js    # Hero + mood check-in + pillars
│               ├── VentSection.js    # Community feed (posts, likes, comments)
│               ├── HelpSection.js    # Volunteer list + live chat
│               ├── SosSection.js     # Crisis support + clinic map
│               ├── CardSection.js    # Health card with distress score
│               └── JournalSection.js # Private journal
├── server/
│   ├── index.js               # Express app + Socket.io server
│   ├── .env                   # MONGO_URI, JWT_SECRET, PORT
│   ├── seed.js                # Seeds volunteers, clinics, sample vents
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   └── admin.js           # Admin role guard
│   ├── models/
│   │   ├── User.js
│   │   ├── Vent.js
│   │   ├── MoodLog.js
│   │   ├── ChatMessage.js     # Live chat messages (deleted after session ends)
│   │   ├── ChatSession.js     # Archived chat history
│   │   ├── Journal.js
│   │   ├── Review.js
│   │   ├── Clinic.js
│   │   └── Volunteer.js       # Legacy (volunteers now stored in User model)
│   └── routes/
│       ├── auth.js
│       ├── vents.js
│       ├── mood.js
│       ├── volunteers.js
│       ├── clinics.js
│       ├── stats.js
│       ├── healthcard.js
│       ├── journal.js
│       ├── chat.js
│       ├── admin.js
│       ├── mentor.js
│       └── reviews.js
```

---

## 3. Data Models

### User
```js
{
  name:        String (required),
  username:    String (required, unique, lowercase 3-20 chars, letters/numbers/underscore),
  email:       String (required, unique),
  password:    String (bcrypt hashed),
  age:         Number (default 0),
  role:        'user' | 'mentor' | 'admin',
  // mentor-only fields:
  specialties: [String],
  bio:         String,
  status:      'available' | 'away' | 'busy',
  sessions:    Number (count of completed sessions),
  rating:      Number (avg from reviews, default 5.0),
  isActive:    Boolean (admin can deactivate),
}
```

### Vent (Community Post)
```js
{
  anon:          String (random anonymous name),
  color:         String (hex color for avatar),
  mood:          'anxious' | 'sad' | 'overwhelmed' | 'hopeful' | 'angry' | 'numb',
  text:          String,
  distress:      Number (0-1, AI-computed from keywords),
  likes:         Number,
  dislikes:      Number,
  likedBy:       [userId strings],
  dislikedBy:    [userId strings],
  mentorReplies: Number (count of mentor comments),
  comments: [{
    userId, userName, isMentor, text,
    likes, dislikes, likedBy, dislikedBy,
    createdAt
  }]
}
```

### MoodLog
```js
{
  userId:  ObjectId,
  score:   Number (1-5),
  label:   String ('Very Low' | 'Low' | 'Okay' | 'Good' | 'Great'),
  slot:    'morning' | 'afternoon' | 'evening',
  note:    String (optional),
}
```
One log per slot per day per user (enforced in route logic).

### ChatMessage (live, deleted after session ends)
```js
{
  sessionId: String (format: "userId__mentorId"),
  from:      'user' | 'mentor',
  fromName:  String,
  text:      String,
}
```

### ChatSession (archived history)
```js
{
  userId:        ObjectId,
  volunteerName: String,
  messages:      [{ from, text, time }],
  escalated:     Boolean,
  duration:      Number (minutes),
}
```

### Journal
```js
{
  userId:  ObjectId,
  title:   String,
  content: String,
  mood:    String,
  emoji:   String,
}
```

### Review
```js
{
  sessionId:  String (unique — one review per session),
  userId:     String,
  mentorId:   String,
  mentorName: String,
  rating:     Number (1-5),
  comment:    String,
}
```

---

## 4. API Routes

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register. Body: `{ name, username, email, password, age, role }`. Returns `{ token, user }`. Username must be unique, 3-20 chars, alphanumeric+underscore. |
| POST | `/login` | No | Login with username OR email. Body: `{ login, password }`. Returns `{ token, user }`. |
| GET | `/check-username/:username` | No | Returns `{ available: true/false }` |

**JWT payload:** `{ id, name, username, role, age }`
**Public user object (never includes email):** `{ name, username, role, age, specialties, bio, status, sessions, rating }`

### Vents — `/api/vents`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | All vents sorted by likes desc |
| POST | `/` | Yes | Create vent. Body: `{ anon, color, mood, text, distress }` |
| POST | `/:id/like` | Yes | Toggle like (removes dislike if present) |
| POST | `/:id/dislike` | Yes | Toggle dislike |
| POST | `/:id/comment` | Yes | Add comment. Body: `{ text }`. Sets `isMentor` from JWT role. |
| POST | `/:id/comment/:cid/like` | Yes | Toggle like on comment |
| POST | `/:id/comment/:cid/dislike` | Yes | Toggle dislike on comment |
| DELETE | `/:id/comment/:cid` | Yes | Delete own comment (or admin) |

### Mood — `/api/mood`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/today` | Yes | Today's mood logs for current user |
| POST | `/` | Yes | Log mood. Body: `{ score, label, slot, note }`. 409 if slot already logged today. |
| GET | `/me` | Yes | Last 30 mood logs (oldest first, for chart) |

### Volunteers — `/api/volunteers`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | All active mentors with derived fields (color, initials, responseTime) |
| POST | `/chat` | Yes | Save chat session to history |

### Clinics — `/api/clinics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | All clinics |
| POST | `/:id/book` | Yes | Book a slot (decrements slots, updates status) |

### Stats — `/api/stats`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | `{ users, ventsToday, volunteers, slots }` — live counts from DB |

### Health Card — `/api/healthcard`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Yes | Full health card data (see section 7) |

### Journal — `/api/journal`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | All journal entries for current user |
| POST | `/` | Yes | Create entry. Body: `{ title, content, mood, emoji }` |
| DELETE | `/:id` | Yes | Delete own entry |

### Chat — `/api/chat`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mentor/active` | Yes (mentor) | Session IDs with messages in last 5 min matching `__mentorId` |
| GET | `/:sessionId` | Yes | Messages for session (optional `?since=ISO` for polling) |
| POST | `/:sessionId` | Yes | Send message. Body: `{ text, from, fromName }` |
| POST | `/:sessionId/end` | Yes | End session, save to ChatSession, delete live messages |

### Mentor — `/api/mentor`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Yes (mentor) | Mentor's own profile |
| PATCH | `/me` | Yes (mentor) | Update `status`, `bio`, `specialties` |
| GET | `/sessions` | Yes (mentor) | Mentor's chat session history |

### Admin — `/api/admin`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | Yes (admin) | `{ totalUsers, totalMentors, totalVents, totalSessions, highDistressVents }` |
| GET | `/mentors` | Yes (admin) | All mentors |
| POST | `/mentors` | Yes (admin) | Create mentor account |
| PATCH | `/mentors/:id` | Yes (admin) | Update mentor (status, isActive, etc.) |
| DELETE | `/mentors/:id` | Yes (admin) | Delete mentor |
| GET | `/users` | Yes (admin) | All users |
| PATCH | `/users/:id` | Yes (admin) | Update user (isActive) |
| GET | `/vents` | Yes (admin) | All vents for moderation |
| DELETE | `/vents/:id` | Yes (admin) | Delete vent |

### Reviews — `/api/reviews`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Submit review. Body: `{ sessionId, mentorId, mentorName, rating, comment }`. Updates mentor avg rating. |
| GET | `/mentor/:mentorId` | No | Reviews for a mentor |

---

## 5. Socket.io Events

Server runs on same port as Express (http server wrapping Express).
Socket auth: JWT token passed in `socket.handshake.auth.token`.

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_session` | `sessionId` | Join a chat room |
| `leave_session` | `sessionId` | Leave a chat room |
| `send_message` | `{ sessionId, text, from, fromName }` | Send message — saved to DB, broadcast to room |
| `typing` | `{ sessionId, isTyping }` | Typing indicator — broadcast to other side |
| `end_session` | `{ sessionId, mentorName, escalated, duration }` | End session — saves to ChatSession, emits `session_ended` to room, deletes live messages |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ _id, sessionId, from, fromName, text, createdAt }` | New message in room |
| `typing` | `{ name, isTyping }` | Other side is typing |
| `session_ended` | `{ endedBy }` | Session was ended |

**Session ID format:** `userId__mentorId` (double underscore separator)

---

## 6. Frontend Architecture

### Routing (App.js)
```
/login          → AuthScreen (public only)
/:section       → RoleRouter:
                    role=admin  → AdminDashboard
                    role=mentor → MentorDashboard
                    role=user   → Dashboard
/               → redirect to /home
```

### Auth State (AuthContext)
- Stored in `localStorage` as `mb_session` = `{ user, token }`
- `user` object: `{ name, username, role, age, specialties, bio, status, sessions, rating }`
- Email is NEVER stored in user object or displayed anywhere in UI
- `loading` state prevents flash of wrong route on refresh

### Socket State (SocketContext)
- Created once when token is available
- Provides `{ socket, connected }` to all components
- Socket authenticates via JWT on connect

### API Client (api/auth.js)
- Base URL: `http://localhost:5000/api`
- Auto-attaches `Authorization: Bearer <token>` from localStorage on every request
- All exports are named functions

---

## 7. Health Card — Distress Score Algorithm

```
distressScore = 
  (5 - avgMoodThisWeek) * 1.5     // low mood = higher distress
  + min(escalations * 1.5, 3)     // SOS escalation history
  + (daysSinceLastCheckin > 14 ? 2 : daysSinceLastCheckin > 7 ? 1 : 0)
  + (checkinStreak === 0 ? 0.5 : 0)

Capped at 10.
```

**Distress levels:**
- 0–2: 🟢 Stable
- 2–5: 🟡 Moderate
- 5+:  🔴 High Risk

**Health card includes:**
- Distress score + level
- Mood trend chart (last 30 check-ins, canvas-drawn)
- Quick stats: avg mood this week/last week, check-in streak, days since last check-in, crisis escalations, total support time
- Slot breakdown: morning/afternoon/evening check-in counts
- Recurring mood themes (top 3 most-logged labels)
- Mental health assessment (4 indicators with green/amber dots)
- Activity timeline (sessions + journal entries, color-coded)

---

## 8. User Roles & Flows

### Regular User (role: 'user')
- Sees: Dashboard with Home, Community, I Need Help, SOS, Health Card, Journal
- Can: Post anonymously in Community, like/dislike posts and comments, comment, chat with mentors, log mood 3x/day, write journal, view own health card

### Mentor (role: 'mentor')
- Sees: MentorDashboard with Overview, Community, Live Chat, Sessions, Profile tabs
- Can: Browse community posts and reply (shows ✓ Volunteer badge), receive live chat sessions from users, end sessions, update own status/bio/specialties
- Cannot: See user emails or personal info

### Admin (role: 'admin')
- Sees: AdminDashboard with Overview, Mentors, Users, Vents tabs
- Can: Create/deactivate/delete mentors, deactivate users, delete vents, view high-distress posts

---

## 9. Key Business Logic

### Anonymous Posting
- Vents are posted with a random anonymous name (e.g. "Quiet Star") and color
- No user ID is stored on the vent — complete anonymity
- Reactions track by userId for toggle logic but are not exposed publicly

### Mood Check-ins
- 3 slots per day: morning (5AM-12PM), afternoon (12PM-6PM), evening (6PM-12AM)
- Midnight (12AM-5AM) maps to evening slot
- Each slot can only be logged once per day (409 if duplicate)
- Users can tap any slot pill to log outside the current time window

### Live Chat Session Flow
1. User clicks "Connect with [Mentor]"
2. Session ID created: `userId__mentorId`
3. Both join socket room with that ID
4. Opening messages sent via socket (saved to ChatMessage in DB)
5. Messages broadcast in real-time via `new_message` event
6. Either side clicks "End Session" → `end_session` socket event
7. Server: saves to ChatSession history, increments mentor sessions, emits `session_ended` to room, deletes ChatMessages
8. User sees review modal (1-5 stars + optional comment)
9. Review updates mentor's average rating

### Distress Detection
- Client-side keyword analysis on vent text (list of ~20 distress words)
- Score 0-1 shown as AI meter in post modal
- Posts with distress > 0.7 get "🤖 High distress" flag
- High-risk keywords in chat trigger escalation alert

### Volunteer Badge
- When a mentor comments on a community post, `isMentor: true` is set
- UI shows `✓ Volunteer` badge in indigo
- Mentor's name shown as "Anonymous" to protect identity
- `mentorReplies` count shown on post as `🌱 N volunteer replies`

---

## 10. Seed Data

Run `node seed.js` from the `server/` directory to populate:
- **Admin:** `admin@mindbridge.ngo` / `admin123`
- **Mentors (6):** `priya@mindbridge.ngo`, `arjun@mindbridge.ngo`, `sneha@mindbridge.ngo`, `rahul@mindbridge.ngo`, `meera@mindbridge.ngo`, `vikram@mindbridge.ngo` — all password: `mentor123`
- **Clinics (6):** Mumbai area with varying availability
- **Sample vents (6):** Covering different moods and distress levels

---

## 11. Environment Variables

```env
# server/.env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/mindbridge?retryWrites=true&w=majority
JWT_SECRET=mindbridge_super_secret_key
PORT=5000
```

---

## 12. Running the Project

```bash
# Terminal 1 — Backend
cd server
node index.js

# Terminal 2 — Frontend
cd client
npm start
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

---

## 13. Important Implementation Notes

- **Username uniqueness:** Enforced at DB level (unique index) and route level. Login accepts username OR email via `$or` query.
- **Email privacy:** Email is stored in DB for auth but never returned in API responses or stored in JWT. All UI shows `username` instead.
- **Socket cleanup:** ChatMessages are deleted immediately when `end_session` fires. Active sessions window is 5 minutes.
- **Vent sorting:** Default sort is by `likes desc` (global ranking). Frontend also supports "New" (by createdAt) and "Top" (likes - dislikes).
- **Health card:** Computed fresh on every request from real DB data — no caching.
- **Review system:** One review per session (upsert). Submitting a review recalculates mentor's average rating across all reviews.
- **CSS:** All styles in `client/src/index.css`. Dark theme with CSS variables. No external UI library.
