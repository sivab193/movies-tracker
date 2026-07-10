# Changelog

All notable changes to Movies Tracker will be documented in this file.

## [Unreleased]

### Added
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
