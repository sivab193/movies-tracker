#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

dotenv.config();

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

function loadAuth(): AuthConfig | null {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

const auth = loadAuth();

if (!auth) {
  console.error("ERROR: Not logged in.");
  console.error("\nPlease run: npx movies-tracker-mcp login");
  process.exit(1);
}

const API_BASE_URL = auth.apiBaseUrl;

class MoviesTrackerMCPServer {
  private server: Server;
  private api: AxiosInstance;
  private auth: AuthConfig;
  private currentAccessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(authConfig: AuthConfig) {
    this.auth = authConfig;

    this.server = new Server(
      {
        name: "movies-tracker-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to handle token refresh
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.setupHandlers();
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    const now = Date.now();
    if (this.currentAccessToken && now < this.tokenExpiry) {
      return this.currentAccessToken;
    }

    // Refresh the token
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: this.auth.refreshToken,
      });

      this.currentAccessToken = response.data.customToken;
      // Set expiry to 50 minutes (tokens last 1 hour, refresh early)
      this.tokenExpiry = now + 50 * 60 * 1000;

      return this.currentAccessToken;
    } catch (error: any) {
      console.error("Failed to refresh access token:", error.message);
      console.error("Please login again: npx movies-tracker-mcp login");
      process.exit(1);
    }
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_my_profile":
            return await this.getMyProfile();

          case "search_movies":
            return await this.searchMovies(args as any);

          case "get_movie_details":
            return await this.getMovieDetails(args as any);

          case "add_watch_history":
            return await this.addWatchHistory(args as any);

          case "delete_watch_entry":
            return await this.deleteWatchEntry(args as any);

          case "update_watch_entry":
            return await this.updateWatchEntry(args as any);

          case "get_leaderboard":
            return await this.getLeaderboard();

          case "get_user_profile":
            return await this.getUserProfile(args as any);

          case "update_settings":
            return await this.updateSettings(args as any);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ""}`,
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: "get_my_profile",
        description:
          "Get the current user's profile including watch history, stats, and settings. Shows total movies watched, total runtime, and complete watch history with movie details.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "search_movies",
        description:
          "Search for movies in the database by title, year, or language. Returns a paginated list of movies with their details including runtime, poster, and IMDB rating.",
        inputSchema: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Search query for movie title or IMDB ID",
            },
            year: {
              type: "number",
              description: "Filter by release year",
            },
            language: {
              type: "string",
              description: "Filter by language (e.g., 'English', 'Tamil')",
            },
            limit: {
              type: "number",
              description: "Number of results to return (default: 20, max: 100)",
            },
            skip: {
              type: "number",
              description: "Number of results to skip for pagination",
            },
          },
        },
      },
      {
        name: "get_movie_details",
        description:
          "Get detailed information about a specific movie including title, year, runtime, IMDB rating, poster, language, and titlecard timing submissions.",
        inputSchema: {
          type: "object",
          properties: {
            movieId: {
              type: "string",
              description: "Movie ID (MongoDB ObjectId or IMDB ID)",
            },
          },
          required: ["movieId"],
        },
      },
      {
        name: "add_watch_history",
        description:
          "Log a new movie watch entry with theater details and ticket information. Automatically updates user stats and leaderboard rankings.",
        inputSchema: {
          type: "object",
          properties: {
            movieId: {
              type: "string",
              description: "Movie ID from the database",
            },
            theaterName: {
              type: "string",
              description: "Name of the theater where movie was watched",
            },
            theaterLocation: {
              type: "string",
              description: "Location/city of the theater",
            },
            ticketCost: {
              type: "number",
              description: "Cost of the ticket",
            },
            currency: {
              type: "string",
              description: "Currency code (INR, USD, etc.)",
              enum: ["INR", "USD", "EUR", "GBP"],
            },
            timestamp: {
              type: "string",
              description: "ISO timestamp of when movie was watched (e.g., '2026-07-10T14:30:00Z')",
            },
          },
          required: ["movieId", "theaterName"],
        },
      },
      {
        name: "delete_watch_entry",
        description:
          "Delete a specific watch history entry. Automatically updates user stats and runtime totals.",
        inputSchema: {
          type: "object",
          properties: {
            entryId: {
              type: "string",
              description: "Watch history entry ID to delete",
            },
          },
          required: ["entryId"],
        },
      },
      {
        name: "update_watch_entry",
        description:
          "Update details of an existing watch history entry (theater, ticket cost, timestamp, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            entryId: {
              type: "string",
              description: "Watch history entry ID to update",
            },
            theaterName: {
              type: "string",
              description: "Updated theater name",
            },
            theaterLocation: {
              type: "string",
              description: "Updated theater location",
            },
            ticketCost: {
              type: "number",
              description: "Updated ticket cost",
            },
            currency: {
              type: "string",
              description: "Updated currency code",
            },
            timestamp: {
              type: "string",
              description: "Updated watch timestamp (ISO format)",
            },
          },
          required: ["entryId"],
        },
      },
      {
        name: "get_leaderboard",
        description:
          "Get the current leaderboard showing top users ranked by total runtime watched. Shows display names, total runtime in seconds, and movie counts.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_user_profile",
        description:
          "Get public profile of any user by their user ID. Shows their watch history, stats, and public information based on privacy settings.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID (firebaseUid or MongoDB ObjectId)",
            },
          },
          required: ["userId"],
        },
      },
      {
        name: "update_settings",
        description:
          "Update user privacy settings and profile preferences including public/private status, leaderboard participation, and display name.",
        inputSchema: {
          type: "object",
          properties: {
            isPublic: {
              type: "boolean",
              description: "Make profile publicly visible",
            },
            joinedLeaderboard: {
              type: "boolean",
              description: "Join or leave the leaderboard",
            },
            displayName: {
              type: "string",
              description: "Update display name",
            },
            publicFields: {
              type: "array",
              items: {
                type: "string",
                enum: ["totalRuntime", "movieCount", "moviesList"],
              },
              description:
                "Fields to make public: totalRuntime, movieCount, moviesList",
            },
          },
        },
      },
    ];
  }

  // Tool implementations

  private async getMyProfile() {
    const response = await this.api.get("/users/me");
    const user = response.data;

    const runtimeHours = Math.floor(user.totalRuntimeSeconds / 3600);
    const runtimeMinutes = Math.floor((user.totalRuntimeSeconds % 3600) / 60);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              profile: {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                isPublic: user.isPublic,
                joinedLeaderboard: user.joinedLeaderboard,
              },
              stats: {
                totalMoviesWatched: user.totalMoviesWatched,
                totalRuntimeSeconds: user.totalRuntimeSeconds,
                totalRuntimeFormatted: `${runtimeHours}h ${runtimeMinutes}m`,
              },
              watchHistory: user.watchHistory || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async searchMovies(args: {
    search?: string;
    year?: number;
    language?: string;
    limit?: number;
    skip?: number;
  }) {
    const params: any = {
      limit: Math.min(args.limit || 20, 100),
      skip: args.skip || 0,
    };

    if (args.search) params.search = args.search;
    if (args.year) params.year = args.year;
    if (args.language) params.language = args.language;

    const response = await this.api.get("/movies", { params });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: response.data.total,
              count: response.data.movies.length,
              movies: response.data.movies.map((m: any) => ({
                id: m.id,
                title: m.title,
                year: m.year,
                runtime: m.runtime,
                language: m.language,
                imdbRating: m.imdbRating,
                imdbId: m.imdbId,
                posterUrl: m.posterUrl,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getMovieDetails(args: { movieId: string }) {
    const response = await this.api.get(`/movies/${args.movieId}`);
    const movie = response.data;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(movie, null, 2),
        },
      ],
    };
  }

  private async addWatchHistory(args: {
    movieId: string;
    theaterName: string;
    theaterLocation?: string;
    ticketCost?: number;
    currency?: string;
    timestamp?: string;
  }) {
    const payload = {
      movieId: args.movieId,
      theaterName: args.theaterName,
      theaterLocation: args.theaterLocation || "",
      ticketCost: args.ticketCost,
      currency: args.currency || "USD",
      timestamp: args.timestamp || new Date().toISOString(),
    };

    const response = await this.api.post("/users/watch-history", payload);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: response.data.message,
              entryId: response.data.id,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async deleteWatchEntry(args: { entryId: string }) {
    // Need to get current user's UID first
    const userResponse = await this.api.get("/users/me");
    const userId = userResponse.data.firebaseUid;

    await this.api.delete(`/users/${userId}/watch-history/${args.entryId}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: "Watch history entry deleted successfully",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async updateWatchEntry(args: {
    entryId: string;
    theaterName?: string;
    theaterLocation?: string;
    ticketCost?: number;
    currency?: string;
    timestamp?: string;
  }) {
    const userResponse = await this.api.get("/users/me");
    const userId = userResponse.data.firebaseUid;

    const payload: any = {};
    if (args.theaterName) payload.theaterName = args.theaterName;
    if (args.theaterLocation) payload.theaterLocation = args.theaterLocation;
    if (args.ticketCost !== undefined) payload.ticketCost = args.ticketCost;
    if (args.currency) payload.currency = args.currency;
    if (args.timestamp) payload.timestamp = args.timestamp;

    await this.api.put(`/users/${userId}/watch-history/${args.entryId}`, payload);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: "Watch history entry updated successfully",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getLeaderboard() {
    const response = await this.api.get("/leaderboard");
    const leaderboard = response.data.leaderboard;

    const formattedLeaderboard = leaderboard.map((user: any, index: number) => {
      const hours = Math.floor(user.totalRuntimeSeconds / 3600);
      const minutes = Math.floor((user.totalRuntimeSeconds % 3600) / 60);

      return {
        rank: index + 1,
        displayName: user.displayName,
        totalRuntimeSeconds: user.totalRuntimeSeconds,
        totalRuntimeFormatted: `${hours}h ${minutes}m`,
        totalMoviesWatched: user.totalMoviesWatched,
        userId: user.userId,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              leaderboard: formattedLeaderboard,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getUserProfile(args: { userId: string }) {
    const response = await this.api.get(`/users/${args.userId}`);
    const profile = response.data;

    if (profile.totalRuntimeSeconds && profile.totalRuntimeSeconds > 0) {
      const hours = Math.floor(profile.totalRuntimeSeconds / 3600);
      const minutes = Math.floor((profile.totalRuntimeSeconds % 3600) / 60);
      profile.totalRuntimeFormatted = `${hours}h ${minutes}m`;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(profile, null, 2),
        },
      ],
    };
  }

  private async updateSettings(args: {
    isPublic?: boolean;
    joinedLeaderboard?: boolean;
    displayName?: string;
    publicFields?: string[];
  }) {
    const payload: any = {};
    if (args.isPublic !== undefined) payload.isPublic = args.isPublic;
    if (args.joinedLeaderboard !== undefined)
      payload.joinedLeaderboard = args.joinedLeaderboard;
    if (args.displayName) payload.displayName = args.displayName;
    if (args.publicFields) payload.publicFields = args.publicFields;

    await this.api.post("/users/settings", payload);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: "Settings updated successfully",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Movies Tracker MCP server running on stdio");
  }
}

export async function startServer() {
  const auth = loadAuth();
  if (!auth) {
    console.error("ERROR: Not logged in.");
    console.error("\nPlease run: npx movies-tracker-mcp login");
    process.exit(1);
  }

  const server = new MoviesTrackerMCPServer(auth);
  await server.run();
}

// Only run server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}
