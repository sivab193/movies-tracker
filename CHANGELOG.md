# Changelog

All notable changes to Movies Tracker will be documented in this file.

## [Unreleased]

### Added
- **Per-page link previews** - every URL now has its own title, description and OG image
  - Movies and series render a card with the real poster art as a blurred backdrop,
    plus year, genre, runtime and rating
  - Short links (`/m/<code>`, `/s/<code>`) and watch orders (`/w/<slug>`) resolve
    server-side, so a shared link previews as the actual title instead of a blank page
  - Public profiles show display name, avatar, movies logged and runtime watched,
    honouring the profile's own privacy settings
  - Distinct cards for Leaderboard, Stats, Timer, Series, Watch Orders, Cards,
    Roadmap, Contact, Watch History, Series History, Dashboard, Settings and Auth
  - Auth-gated pages are marked `noindex`

- **Reorganized navigation** - one shared config (`ui/lib/nav.ts`) drives every nav surface
  - Desktop header collapsed from 8 flat links to `Timer` + `Discover` / `Community` dropdowns
  - Mobile bottom nav: 4 tabs + raised TitleCard Timer button, with `Discover` and `More` bottom sheets
  - Series, Watch Orders, Stats, Settings, Roadmap and Contact are now reachable on mobile
  - Active-state highlighting across header, dropdowns and tabs
  - Command palette (Cmd/Ctrl+K) over every destination plus theme and auth actions
  - Footer sitemap generated from the same nav config

- **Series watch counts** - seasons track how many times they were watched
  - `seasonCounts`, `totalWatchCount`, `runtimeWatchedMinutes`, `lastWatchedAt` and `completedAt` on `seriesProgress`
  - New actions on `POST /api/users/series-progress`: `watch`, `unwatch`, `increment`, `decrement`, `set`, `watchAll`, `unwatchAll`, `incrementAll`
  - Mark an entire series watched, or log a full rewatch, in one action
  - Editable per-season watch counts
  - `GET /api/users/<uid>/series-progress` returns enriched entries plus aggregate totals

- **Series History page** (`/series-history`)
  - Summary tiles for series tracked, completed, seasons watched and runtime watched
  - Per-series season chips with watch counts, inline count editing and rewatch/remove actions

### Fixed
- Per-page metadata never applied: 11 `metadata.ts` files sat next to client `page.tsx`
  files, which Next.js does not read, so every link fell back to the generic
  MediaVerse card. Replaced with server `layout.tsx` files.
- Marking a season watched had no visible effect - the series detail page read `watchedSeasons`
  off the response root while the API nested it under `seriesProgress`
- Home page CTAs sent signed-in users to the sign-in screen instead of their dashboard

- **MCP Server Integration** - Model Context Protocol server for Claude AI and other assistants
  - Device authorization flow (OAuth-like code verification)
  - Long-lived refresh tokens (1 year expiry)
  - Automatic token refresh mechanism
  - CLI commands: `login`, `logout`, `status`, `test`
  - 9 MCP tools for movie search, watch history management, and stats
  
- **Backend Device Auth API** (`/api/auth/*`)
  - `POST /device/code` - Generate device authorization code
  - `POST /device/poll` - CLI polling endpoint
  - `POST /device/verify` - User code verification
  - `POST /refresh` - Access token refresh
  - `POST /revoke` - Token revocation
  
- **Frontend Device Authorization Page** (`/device`)
  - Beautiful UI for entering authorization codes
  - Real-time verification with backend
  - User-friendly error messages
  
- **Database Collections**
  - `device_codes` - Temporary authorization codes (15 min TTL)
  - `refresh_tokens` - Long-lived tokens for CLI/MCP access

### Changed
- Updated main README with MCP server documentation
- Enhanced backend README with device auth flow details
- Updated frontend README with device page documentation

### Security
- Refresh tokens stored with restricted permissions (0600)
- Device codes expire after 15 minutes
- Access tokens auto-refresh before expiry
- Support for token revocation

## [1.0.0] - Previous Release

### Features
- Full-stack movie watch history tracking
- TitleCard precision timer with community submissions
- Annual runtime leaderboard
- Firebase Google OAuth authentication
- MongoDB Atlas for data storage
- Admin dashboard for theater and movie management
- Infinite scroll movie catalog
- Binary poster storage in MongoDB
- Hybrid Vercel deployment (Next.js + Flask)

---

## Migration Notes

### Device Auth Flow
If you have existing users, no migration needed. The device auth flow is additive:
- Existing Firebase auth continues to work for web/mobile
- Device auth is specifically for CLI/MCP clients
- Both authentication methods are supported simultaneously

### Database
New collections will be auto-created on first use:
- `device_codes` - Managed by TTL index (15 min)
- `refresh_tokens` - Long-lived credentials

No changes to existing collections (`users`, `movies`, `theaters`, etc.)
