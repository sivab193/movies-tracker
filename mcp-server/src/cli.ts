#!/usr/bin/env node

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".movies-tracker");
const AUTH_FILE = path.join(CONFIG_DIR, "auth.json");

interface AuthConfig {
  refreshToken: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
  };
  apiBaseUrl: string;
}

// Get API base URL from env or default
const API_BASE_URL = process.env.API_BASE_URL || "https://mv.siv19.dev/api";

async function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadAuth(): AuthConfig | null {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore errors, will prompt for login
  }
  return null;
}

function saveAuth(config: AuthConfig) {
  ensureConfigDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2));
  fs.chmodSync(AUTH_FILE, 0o600); // Make file readable only by owner
}

function clearAuth() {
  if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login() {
  console.log("🔐 MediaVerse - Device Authorization\n");

  try {
    // Step 1: Request device code
    const codeResponse = await axios.post(`${API_BASE_URL}/auth/device/code`);
    const { userCode, deviceCode, verificationUri, expiresIn } =
      codeResponse.data;

    console.log(
      "→ Visit: \x1b[36m\x1b[4mhttps://mv.siv19.dev" +
        verificationUri +
        "\x1b[0m",
    );
    console.log(`→ Enter code: \x1b[1m\x1b[33m${userCode}\x1b[0m\n`);
    console.log("Waiting for authorization... ⏳\n");

    // Step 2: Poll for authorization
    const startTime = Date.now();
    const maxTime = expiresIn * 1000; // Convert to milliseconds

    while (Date.now() - startTime < maxTime) {
      try {
        const pollResponse = await axios.post(
          `${API_BASE_URL}/auth/device/poll`,
          {
            deviceCode,
          },
        );

        if (pollResponse.data.status === "authorized") {
          const { refreshToken, user } = pollResponse.data;

          // Save credentials
          saveAuth({
            refreshToken,
            user,
            apiBaseUrl: API_BASE_URL,
          });

          console.log(
            "\x1b[32m✓\x1b[0m Logged in as \x1b[1m" + user.email + "\x1b[0m",
          );
          console.log("\x1b[32m✓\x1b[0m Credentials saved to " + AUTH_FILE);
          console.log("\nYou can now use the MCP server!");
          return;
        }
      } catch (error: any) {
        if (error.response?.status === 400) {
          console.error("\n\x1b[31m✗\x1b[0m " + error.response.data.error);
          process.exit(1);
        }
        // Other errors - keep polling
      }

      await sleep(3000); // Poll every 3 seconds
    }

    console.error(
      "\n\x1b[31m✗\x1b[0m Authorization timed out. Please try again.",
    );
    process.exit(1);
  } catch (error: any) {
    console.error("\n\x1b[31m✗\x1b[0m Login failed:", error.message);
    process.exit(1);
  }
}

async function logout() {
  const auth = loadAuth();

  if (!auth) {
    console.log("Not logged in.");
    return;
  }

  try {
    // Revoke refresh token on server
    await axios.post(`${auth.apiBaseUrl}/auth/revoke`, {
      refreshToken: auth.refreshToken,
    });
  } catch (error) {
    // Continue even if revoke fails
  }

  clearAuth();
  console.log("\x1b[32m✓\x1b[0m Logged out successfully");
}

async function status() {
  const auth = loadAuth();

  if (!auth) {
    console.log("Status: \x1b[31mNot logged in\x1b[0m");
    console.log("\nRun: \x1b[36mnpx movies-tracker-mcp login\x1b[0m");
    return;
  }

  console.log("Status: \x1b[32mLogged in\x1b[0m");
  console.log("\nUser:");
  console.log("  Email:        " + auth.user.email);
  console.log("  Display Name: " + auth.user.displayName);
  console.log("  UID:          " + auth.user.uid);
  console.log("\nAPI Base URL:   " + auth.apiBaseUrl);
  console.log("Auth File:      " + AUTH_FILE);
}

async function testConnection() {
  const auth = loadAuth();

  if (!auth) {
    console.error(
      "\x1b[31m✗\x1b[0m Not logged in. Run: npx movies-tracker-mcp login",
    );
    process.exit(1);
    return;
  }

  console.log("Testing connection...\n");

  try {
    // Get a fresh access token
    const refreshResponse = await axios.post(
      `${auth.apiBaseUrl}/auth/refresh`,
      {
        refreshToken: auth.refreshToken,
      },
    );

    const customToken = refreshResponse.data.customToken;

    // Test API call
    const response = await axios.get(`${auth.apiBaseUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${customToken}`,
      },
    });

    console.log("\x1b[32m✓\x1b[0m Connection successful!");
    console.log("\nProfile:");
    console.log("  Display Name: " + response.data.displayName);
    console.log("  Movies:       " + response.data.totalMoviesWatched);
    console.log(
      "  Runtime:      " +
        Math.floor(response.data.totalRuntimeSeconds / 3600) +
        "h " +
        Math.floor((response.data.totalRuntimeSeconds % 3600) / 60) +
        "m",
    );
  } catch (error: any) {
    console.error("\x1b[31m✗\x1b[0m Connection failed:", error.message);

    if (error.response?.status === 401) {
      console.log("\nYour session may have expired. Try logging in again:");
      console.log("  \x1b[36mnpx movies-tracker-mcp login\x1b[0m");
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(`
\x1b[1mMediaVerse MCP CLI\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  npx movies-tracker-mcp [command]

\x1b[1mCOMMANDS:\x1b[0m
  login      Login via device authorization flow
  logout     Logout and clear credentials
  status     Show current login status
  test       Test connection to API
  help       Show this help message

\x1b[1mEXAMPLES:\x1b[0m
  # Login for the first time
  npx movies-tracker-mcp login

  # Check if logged in
  npx movies-tracker-mcp status

  # Test connection
  npx movies-tracker-mcp test

\x1b[1mCONFIGURATION:\x1b[0m
  After logging in, configure your MCP client:

  \x1b[2mClaude Desktop (~/.config/claude/claude_desktop_config.json):\x1b[0m
  {
    "mcpServers": {
      "movies-tracker": {
        "command": "npx",
        "args": ["-y", "movies-tracker-mcp"]
      }
    }
  }

  \x1b[2mClaude Code CLI (~/.claude/settings.json):\x1b[0m
  {
    "mcpServers": {
      "movies-tracker": {
        "command": "npx",
        "args": ["-y", "movies-tracker-mcp"]
      }
    }
  }

\x1b[1mDOCUMENTATION:\x1b[0m
  https://github.com/sivab/movies-tracker
`);
}

// Main CLI router
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "login":
      await login();
      break;

    case "logout":
      await logout();
      break;

    case "status":
      await status();
      break;

    case "test":
      await testConnection();
      break;

    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;

    default:
      // No command = run MCP server
      if (command) {
        console.error(`Unknown command: ${command}`);
        console.log("Run 'npx movies-tracker-mcp help' for usage");
        process.exit(1);
      }

      // Import and run the MCP server
      const { startServer } = await import("./index.js");
      await startServer();
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
