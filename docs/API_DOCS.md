# 🎬 Movies Tracker — REST API Documentation

This document provides complete technical reference and endpoint specification for the **Movies Tracker Flask Backend API**.

---

## 🔒 Authentication & Authorization

All protected endpoints require a valid **Firebase Authentication ID Token** passed in the HTTP `Authorization` header as a Bearer token.

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

When a request arrives, the backend intercepts the token via the `@verify_token` decorator, verifies it against Google's Firebase Admin SDK, and injects `request.user` containing the authenticated `uid`, `email`, and claims into the route handler.

### Error Codes for Authentication
| Status Code | Error Message | Reason |
| :--- | :--- | :--- |
| `401 Unauthorized` | `No token provided` | Missing `Authorization` header |
| `401 Unauthorized` | `Invalid token format` | Header not formatted as `Bearer <token>` |
| `401 Unauthorized` | `Invalid token` / `Token expired` | Token verification failed via Firebase Admin SDK |
| `403 Forbidden` | `Admin privileges required` | Authenticated user is not marked as `isAdmin: true` in MongoDB |

---

## 📚 Endpoints Overview

| Method | Route | Description | Auth Required | Admin Required |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/users/me` | Get current user's profile and watch history | Yes | No |
| **PUT** | `/api/users/me` | Update current user's settings and profile | Yes | No |
| **POST** | `/api/users/watch-history` | Log a new movie watch entry | Yes | No |
| **PUT** | `/api/users/{uid}/watch-history/{entryId}` | Edit an existing watch history entry | Yes | No |
| **GET** | `/api/users/admin/requests` | Get all pending admin privilege requests | Yes | Yes |
| **POST** | `/api/users/admin/requests/resolve` | Approve or reject an admin request | Yes | Yes |
| **GET** | `/api/movies` | Get paginated list of movies (`skip`, `limit`) | No | No |
| **POST** | `/api/movies` | Fetch movie from OMDb and save to catalog | Yes | Yes |
| **DELETE**| `/api/movies/{movieId}` | Delete a movie from the catalog | Yes | Yes |
| **GET** | `/api/movies/{movieId}/poster` | Serve binary poster image stored in MongoDB | No | No |
| **GET** | `/api/theaters` | List all approved movie theaters | No | No |
| **POST** | `/api/theaters` | Add a new theater to approved list | Yes | Yes |
| **DELETE**| `/api/theaters/{theaterId}` | Remove an approved theater | Yes | Yes |
| **GET** | `/api/leaderboard` | Get annual top watch time rankings | No | No |

---

## 👤 User Profiles & Watch History (`/api/users/*`)

### `GET /api/users/me`
Fetches the profile details, watch stats, and complete watch history of the currently authenticated user. If the user does not exist in MongoDB, a profile is automatically provisioned.

- **Headers**: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- **Response `200 OK`**:
```json
{
  "_id": "64d2f8a1b2c3d4e5f6a7b8c9",
  "firebaseUid": "a1b2c3d4e5f6g7h8i9j0",
  "email": "user@example.com",
  "displayName": "Siva",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "isAdmin": true,
  "isPublic": true,
  "totalMoviesWatched": 42,
  "totalRuntimeSeconds": 315000,
  "adminRequestStatus": "approved",
  "watchHistory": [
    {
      "_id": "64e3a1b2c3d4e5f6a7b8c9d0",
      "movieId": "64d1a2b3c4d5e6f7a8b9c0d1",
      "imdbId": "tt15398776",
      "movieTitle": "Oppenheimer",
      "moviePosterUrl": "/api/movies/64d1a2b3c4d5e6f7a8b9c0d1/poster",
      "theaterName": "PVR Cinemas",
      "theaterLocation": "Chennai",
      "ticketCost": 350.0,
      "currency": "INR",
      "ticketStubUrl": null,
      "timestamp": "2026-07-10T00:00:00.000Z",
      "createdAt": "2026-07-10T04:00:00.000Z"
    }
  ]
}
```

---

### `PUT /api/users/me`
Updates user settings such as public visibility or requests admin access.

- **Headers**: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- **Request Body**:
```json
{
  "displayName": "Siva B",
  "isPublic": true,
  "requestAdmin": true,
  "adminRequestReason": "Managing movie catalog and theaters for the community"
}
```
- **Response `200 OK`**: Updated user profile object.

---

### `POST /api/users/watch-history`
Records a new movie watch entry for the authenticated user and automatically increments `totalMoviesWatched` and `totalRuntimeSeconds`.

- **Headers**: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- **Request Body**:
```json
{
  "movieId": "64d1a2b3c4d5e6f7a8b9c0d1",
  "theaterName": "PVR Cinemas",
  "theaterLocation": "Chennai",
  "ticketCost": 300,
  "currency": "INR",
  "timestamp": "2026-07-10T14:30:00.000Z",
  "ticketStubImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```
- **Response `201 Created`**:
```json
{
  "message": "Watch history added successfully",
  "watchEntry": {
    "_id": "64e3a1b2c3d4e5f6a7b8c9e1",
    "movieId": "64d1a2b3c4d5e6f7a8b9c0d1",
    "movieTitle": "Dune: Part Two",
    "timestamp": "2026-07-10T14:30:00.000Z"
  }
}
```

---

## 🎬 Movie Catalog (`/api/movies/*`)

### `GET /api/movies`
Retrieves a paginated list of movies from the global database.

- **Query Parameters**:
  - `skip` (optional, integer, default `0`): Number of records to skip.
  - `limit` (optional, integer, default `20`): Maximum records to return.
- **Response `200 OK`**:
```json
{
  "total": 742,
  "movies": [
    {
      "_id": "64d1a2b3c4d5e6f7a8b9c0d1",
      "imdbId": "tt15398776",
      "title": "Oppenheimer",
      "year": "2023",
      "runtime": "180 min",
      "runtimeSeconds": 10800,
      "posterUrl": "/api/movies/64d1a2b3c4d5e6f7a8b9c0d1/poster",
      "genre": "Biography, Drama, History",
      "director": "Christopher Nolan",
      "imdbRating": "8.9"
    }
  ]
}
```

---

### `POST /api/movies` *(Admin Only)*
Fetches movie details and poster from OMDb API using an IMDb ID (`ttXXXXX`) and inserts it into the database.

- **Headers**: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- **Request Body**:
```json
{
  "imdbId": "tt15398776"
}
```
- **Response `201 Created`**: Movie document as inserted into MongoDB.

---

### `GET /api/movies/{movieId}/poster`
Serves the binary image file stored inside MongoDB's `movie_posters` collection with appropriate `Content-Type` headers (`image/jpeg`, `image/png`).

- **Auth**: None required (Public static asset route).
- **Response `200 OK`**: Binary image stream.

---

## 🏢 Approved Theaters (`/api/theaters/*`)

### `GET /api/theaters`
Returns the list of all approved theaters where users can log movie watches.

- **Response `200 OK`**:
```json
[
  {
    "id": "64d5f1a2b3c4d5e6f7a8b9c0",
    "name": "PVR Cinemas",
    "location": "Chennai",
    "addedBy": "admin_uid"
  }
]
```

---

### `POST /api/theaters` *(Admin Only)*
Adds a new approved theater. Checks for case-insensitive duplicates automatically.

- **Headers**: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- **Request Body**:
```json
{
  "name": "SPI Cinemas",
  "location": "Chennai"
}
```
- **Response `201 Created`**: The newly created theater object.

---

## 🏆 Leaderboard (`/api/leaderboard/*`)

### `GET /api/leaderboard`
Returns the top users ranked by `totalRuntimeSeconds` across all movies watched in the current year (`2026`). Only users with `isPublic: true` are returned.

- **Response `200 OK`**:
```json
[
  {
    "userId": "a1b2c3d4e5f6g7h8i9j0",
    "displayName": "Siva B",
    "photoURL": "https://lh3.googleusercontent.com/...",
    "totalRuntimeSeconds": 315000,
    "totalMoviesWatched": 42,
    "isPublic": true
  }
]
```
