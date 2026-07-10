# Setup Guide - Movies Tracker MCP Server

## Quick Start (For End Users)

### 1. Login
```bash
npx movies-tracker-mcp login
```

Follow the prompts:
1. Visit: https://mt.siv19.dev/device
2. Enter the code shown (e.g., WXYZ-ABCD)
3. Authorize in your browser
4. Done! ✓

### 2. Configure Your AI Client

#### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "movies-tracker": {
      "command": "npx",
      "args": ["-y", "movies-tracker-mcp"]
    }
  }
}
```

#### Claude Code CLI

`~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "movies-tracker": {
      "command": "npx",
      "args": ["-y", "movies-tracker-mcp"]
    }
  }
}
```

#### Aider

`~/.aider.conf.yml`:

```yaml
mcp-servers:
  movies-tracker:
    command: npx
    args:
      - -y
      - movies-tracker-mcp
```

### 3. Restart Your AI Client

Restart Claude Desktop, Claude Code, or Aider to load the MCP server.

### 4. Test It!

Ask your AI assistant:
- "Show me my Movies Tracker watch history"
- "Search for movies with Dune in the title"
- "What's my total watch time?"

---

## For Local Development

### Backend Setup

```bash
cd backend

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
cat <<EOT >> .env
MONGO_URI=your_mongo_atlas_uri
OMDB_API_KEY=your_omdb_key
FIREBASE_SERVICE_ACCOUNT_KEY=backend/serviceAccountKey.json
PORT=8000
EOT

# Run backend
python app.py
```

### MCP Server Setup

```bash
cd mcp-server

# Install dependencies
npm install

# Build
npm run build

# Login to local backend
API_BASE_URL=http://localhost:8000/api npm start login

# Test
npm start test

# Run MCP server
npm start
```

### Test Local Setup

```bash
# Terminal 1: Backend
cd backend && python app.py

# Terminal 2: MCP Server  
cd mcp-server && npm start

# Terminal 3: Test CLI
cd mcp-server
npm start status
npm start test
```

---

## Publishing to npm

### 1. Update package.json

```json
{
  "name": "movies-tracker-mcp",
  "version": "1.0.0",
  "description": "MCP server for Movies Tracker - https://mt.siv19.dev",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/movies-tracker.git"
  },
  "keywords": ["mcp", "movies", "tracker", "claude", "ai"],
  "author": "Siva B",
  "license": "MIT"
}
```

### 2. Login to npm

```bash
npm login
```

### 3. Publish

```bash
cd mcp-server
npm publish
```

### 4. Users Can Now Install

```bash
npx movies-tracker-mcp login
```

---

## Troubleshooting

### "Not logged in" error

```bash
npx movies-tracker-mcp login
```

### Device code expired

Codes expire after 15 minutes. Just run login again:
```bash
npx movies-tracker-mcp login
```

### "Connection failed" error

Check if backend is accessible:
```bash
curl https://mt.siv19.dev/api/health
```

Should return:
```json
{"status": "healthy", "service": "backend"}
```

### Token refresh failed

Logout and login again:
```bash
npx movies-tracker-mcp logout
npx movies-tracker-mcp login
```

### MCP server not showing in Claude

1. Check config file location and syntax
2. Verify absolute path (if using `node` instead of `npx`)
3. Restart Claude Desktop/CLI
4. Check logs:
   - **macOS:** `~/Library/Logs/Claude/`
   - **Windows:** `%APPDATA%\Claude\logs\`

---

## Architecture

### Device Authorization Flow

```
1. CLI requests device code
   ├─> POST /api/auth/device/code
   └─> Returns: userCode (WXYZ-ABCD) & deviceCode (secret)

2. User visits https://mt.siv19.dev/device
   ├─> Enters userCode
   ├─> Signs in with Google OAuth (Firebase)
   └─> POST /api/auth/device/verify

3. CLI polls for authorization
   ├─> POST /api/auth/device/poll (every 3 seconds)
   └─> Returns refreshToken when authorized

4. CLI saves credentials
   └─> ~/.movies-tracker/auth.json

5. MCP server auto-refreshes tokens
   ├─> POST /api/auth/refresh (when token expires)
   └─> Returns fresh accessToken (valid 1 hour)
```

### Database Collections

- `device_codes` - Temporary codes (15 min TTL)
- `refresh_tokens` - Long-lived tokens (1 year)
- `users` - User profiles and watch history
- `movies` - Movie catalog
- `leaderboard` - Computed on-demand

---

## Security

- Refresh tokens stored locally: `~/.movies-tracker/auth.json`
- File permissions: `0600` (owner read/write only)
- Access tokens refresh every 50 minutes (expire at 60)
- Device codes expire after 15 minutes
- Refresh tokens expire after 1 year
- Revoke anytime: `npx movies-tracker-mcp logout`

---

## Support

- **Website:** https://mt.siv19.dev
- **Issues:** GitHub Issues
- **Documentation:** https://github.com/yourusername/movies-tracker-mcp
