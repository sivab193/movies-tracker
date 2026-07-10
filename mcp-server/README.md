# Movies Tracker MCP Server

An MCP (Model Context Protocol) server that enables Claude and other AI assistants to interact with your Movies Tracker application through natural language.

## Features

The MCP server exposes these tools to Claude:

### User Profile & Stats
- **get_my_profile** - View your complete profile, stats, and watch history
- **update_settings** - Change privacy settings, display name, and leaderboard participation

### Movie Discovery
- **search_movies** - Search movies by title, year, or language
- **get_movie_details** - Get detailed info about a specific movie

### Watch History Management
- **add_watch_history** - Log a new movie watch with theater and ticket details
- **update_watch_entry** - Update existing watch history entries
- **delete_watch_entry** - Remove watch history entries

### Social Features
- **get_leaderboard** - View current rankings by total runtime
- **get_user_profile** - Check out other users' public profiles

## Quick Start

### 1. Login (One Time Setup)

```bash
npx movies-tracker-mcp login
```

This will:
1. Show you a code (e.g., `WXYZ-ABCD`)
2. Open your browser to enter the code
3. Save your credentials securely in `~/.movies-tracker/auth.json`
4. Auto-refresh tokens - you never need to login again!

**That's it!** No need to manually copy tokens or manage credentials.

### 2. Configure Your AI Client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

Add to `~/.claude/settings.json`:

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

Restart your AI client and you're ready!

## CLI Commands

```bash
# Login via device flow
npx movies-tracker-mcp login

# Check login status
npx movies-tracker-mcp status

# Test connection to API
npx movies-tracker-mcp test

# Logout and clear credentials
npx movies-tracker-mcp logout

# Show help
npx movies-tracker-mcp help
```

## Example Conversations with Claude

Once configured, you can ask Claude:

- "Show me my movie watch history"
- "Search for sci-fi movies from 2023"
- "Add a watch entry for Oppenheimer at AMC Theater, ticket was $15"
- "Who's ranked #1 on the leaderboard?"
- "Update my last watch entry to fix the theater name"
- "How many hours of movies have I watched total?"

**Live at:** https://mt.siv19.dev

## How It Works

1. **Device Authorization Flow** (like GitHub CLI)
   - No manual token copying
   - Secure OAuth via your browser
   - Long-lived refresh tokens (1 year)

2. **Automatic Token Refresh**
   - MCP server auto-refreshes access tokens
   - You stay logged in indefinitely
   - No token expiry headaches

3. **Local Storage**
   - Credentials stored in `~/.movies-tracker/auth.json`
   - File permissions: read-only by owner (0600)
   - Works across all MCP clients

## Troubleshooting

### "Not logged in" error
```bash
npx movies-tracker-mcp login
```

### Check if logged in
```bash
npx movies-tracker-mcp status
```

### Test connection
```bash
npx movies-tracker-mcp test
```

### Token expired
The MCP server auto-refreshes tokens. If you get auth errors:
```bash
npx movies-tracker-mcp logout
npx movies-tracker-mcp login
```

### Tools not showing in Claude
- Verify config file location and syntax
- Restart Claude Desktop/CLI after config changes
- Check logs: `~/Library/Logs/Claude/` (Mac)

## For Developers

### Local Development

```bash
cd mcp-server
npm install
npm run build

# Login locally
npm start login

# Run MCP server
npm start
```

### Environment Variables

The MCP server automatically uses production API by default:
- `API_BASE_URL`: https://mt.siv19.dev/api

For local development against your backend:
```bash
API_BASE_URL=http://localhost:8000/api npx movies-tracker-mcp login
```

## Security

- Refresh tokens are stored locally in `~/.movies-tracker/auth.json`
- File permissions restricted to owner only
- Tokens expire after 1 year
- Access tokens auto-refresh every hour
- Revoke access anytime: `npx movies-tracker-mcp logout`

## Publishing to npm

```bash
npm publish
```

Users can then install with:
```bash
npx movies-tracker-mcp login
```

## License

MIT
