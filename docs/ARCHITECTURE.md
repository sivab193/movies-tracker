# 🏗️ Movies Tracker — System Architecture & Engineering Guide

This document describes the end-to-end architecture, data pipelines, authentication flow, and deployment topology of **Movies Tracker**.

---

## 🌐 High-Level Topology

Movies Tracker is architected as a **monorepo hybrid web application** deployed on **Vercel**, bridging a **Next.js 16 (React/TypeScript)** frontend with a **Python Flask 3.10+** API backend backed by **MongoDB Atlas** and **Google Cloud Storage**.

```mermaid
graph TD
    subgraph Client [Client Tier]
        Browser[Web Browser / PWA]
        AuthClient[Firebase Auth SDK]
    end

    subgraph Vercel [Vercel Edge & Routing]
        Proxy[vercel.json Proxy / Serverless Gateway]
        NextApp[Next.js 16 App Router UI]
        FlaskFunc[Python Flask Serverless Function]
    end

    subgraph CloudServices [Data & Identity Cloud]
        FirebaseAuth[Google Firebase Authentication]
        MongoAtlas[(MongoDB Atlas Cluster)]
        GCS[(Google Cloud Storage - Posters & Stubs)]
        OMDB[OMDb API - Movie Catalog]
    end

    Browser <-->|HTTPS / UI Interactions| NextApp
    Browser -->|Google OAuth Sign-In| FirebaseAuth
    FirebaseAuth -->|Returns JWT ID Token| AuthClient
    AuthClient -->|API Requests + Bearer Token| Proxy

    Proxy -->|Static/Route: /*| NextApp
    Proxy -->|API Proxy: /api/*| FlaskFunc

    FlaskFunc <-->|Verify JWT & Get Claims| FirebaseAuth
    FlaskFunc <-->|PyMongo Document Operations| MongoAtlas
    FlaskFunc <-->|Store/Retrieve Binary Posters| MongoAtlas
    FlaskFunc <-->|Fetch Movie Metadata| OMDB
```

---

## 🔐 Request Lifecycle & Security Architecture

Every API request targeting `/api/users/*`, `/api/movies` (mutation), or `/api/theaters` (mutation) goes through a strict **multi-stage authentication and authorization pipeline**:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant UI as Next.js 16 UI (`api.ts`)
    participant FB as Firebase Auth Engine
    participant API as Flask Backend Route (`@verify_token`)
    participant DB as MongoDB Atlas (`users` / `movies`)

    Note over User,FB: 1. Authentication Phase
    User->>UI: Click Log In with Google
    UI->>FB: signInWithPopup(auth, googleProvider)
    FB-->>UI: Authenticated Firebase User & ID Token

    Note over UI,API: 2. API Transport Phase
    UI->>API: HTTP Request + Header `Authorization: Bearer <ID_Token>`
    
    Note over API,DB: 3. Token Verification Phase (`firebase_config.py`)
    API->>API: Extract Bearer Token string
    API->>FB: `auth.verify_id_token(token)` via Firebase Admin SDK
    alt Invalid or Expired Token
        FB-->>API: TokenVerificationError
        API-->>UI: 401 Unauthorized (`Invalid token format or signature`)
    else Valid Token
        FB-->>API: Decoded Token Claims (`uid`, `email`)
        Note over API,DB: 4. User Provisioning / Resolution
        API->>DB: `db.users.find_one({"firebaseUid": uid})`
        alt User Not Found in DB
            API->>DB: Provision New User Profile (`isAdmin: false`)
        end
        API->>DB: Check Role (`request.user.get('isAdmin')`)
        API-->>UI: 200 OK / 201 Created with JSON Response
    end
```

---

## 💾 Storage Architecture: Embedded vs. Binary

### 1. Watch History (Embedded Array pattern)
Instead of a separate `watches` collection that requires expensive joins (`$lookup`) on every page load, user watch history is stored inside the user document (`users.watchHistory` array).
- **Benefit**: Zero-latency atomic reads when loading user profiles or computing running watch totals.
- **Aggregation**: Running totals (`totalMoviesWatched`, `totalRuntimeSeconds`) are updated atomically (`$inc` operator) whenever a watch entry is inserted or deleted.

### 2. Movie Posters (Dual Storage Strategy)
- Posters fetched from OMDb (`posterUrl`) are automatically downloaded and stored as **MongoDB `Binary` blobs** inside `movie_posters` (`movieId`, `imageData`, `mimeType`).
- **Why?**: OMDb external URLs frequently expire or get rate-limited. Storing the binary blob inside MongoDB ensures permanent availability via our dedicated `/api/movies/<movieId>/poster` route without incurring external CDN bandwidth costs.

---

## ⚡ Pagination & Infinite Scroll Architecture

To handle thousands of movies efficiently:
1. **API Tier**: `GET /api/movies?skip=X&limit=20` returns sliced results along with `total: count_documents(query)`.
2. **UI Tier**: `IntersectionObserver` monitors a sentinel `<div>` at the bottom of the grid. When triggered, it fires `getMovies(currentSkip + 20, 20)` and appends new cards seamlessly.
