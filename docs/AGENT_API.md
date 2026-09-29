# Muse Agent API

Muse can only call the key-authenticated catalog endpoints below. They are not
Firebase user-session routes and do not provide user, admin, or delete access.

## Authentication and rotation

Send the secret only as `X-MediaVerse-Agent-Key`. Never include it in a URL,
source file, request body, or log.

For first-time setup, set `MEDIA_VERSE_AGENT_KEY` in the backend environment.
For rotation without a deployment, store SHA-256 hashes in MongoDB's
`agent_api_config` collection:

```json
{
  "_id": "muse",
  "keyHashes": ["<current-sha256>", "<next-sha256>"]
}
```

Keep both hashes during the vault rollout, then remove the retired hash. The
backend reads this document on every agent request, so the change is immediate.
`MEDIA_VERSE_AGENT_DAILY_LIMIT` defaults to `100` and may be adjusted in the
environment. The rate-limit bucket is per active key per UTC day.

MediaVerse admins can now manage this without direct database access at
`https://www.media-verse.in/admin/muse`: generate a key, copy the one-time
value into Muse's Secure Vault, then retire the previous key after confirmation.
The portal stores only the hash and operational metadata; it never displays a
previously generated key again.

## Endpoints

`POST /api/agent/movies/upsert` creates or updates a movie. It requires
`externalRef`, `title`, `language` (`Tamil`, `Hindi`, `Malayalam`, or
`English`), and `releaseDate` (`YYYY-MM-DD`). Optional fields are updated only
when supplied; omitted fields remain untouched.

Deduplication order is `externalRef`, then `tmdbId`, then case-insensitive
`title` plus `releaseDate`. The response is always:

```json
{
  "id": "mongo-document-id",
  "slug": "kill-bill-vol-1-2003",
  "pageUrl": "https://www.media-verse.in/m/kill-bill-vol-1-2003",
  "created": false
}
```

Muse may supply an optional lowercase URL-safe `slug` (for example,
`kill-bill-vol-1-2003`). It becomes the permanent
`https://www.media-verse.in/m/<slug>` link returned in `pageUrl`. If omitted,
the API derives one from the title and year and adds a deterministic suffix only
if another movie already owns it. The site resolves permanent Muse slugs before
checking its old, expiring six-character share codes, so the two remain
compatible.

When `posterUrl` is supplied, the backend fetches it into the existing
first-party `movie_posters` store and saves only `/api/movies/<id>/poster` on
the movie. If caching fails, the API returns `500 {"error":"internal"}` and
Muse can retry the same `externalRef`; the external URL is never published.

`GET /api/agent/movies?tmdbId=24` or
`GET /api/agent/movies?title=Kill%20Bill%3A%20Vol.%201&releaseDate=2003-10-10`
returns the same response shape. A missing movie returns
`404 {"error":"not_found"}`.

All agent errors are JSON: missing/invalid keys return `401`, invalid request
fields return `400` with `error` and `field`, rate limiting returns `429`, and
unhandled failures return `500 {"error":"internal"}`.

## Theaters

`POST /api/agent/theaters/upsert` creates or updates a theater. It requires
`externalRef`, `name`, and `location`; `gmapsLink`, `openedYear`,
`renovatedYear`, `website`, `notes`, `amenities`, `ticketPlatforms`, and
`screens` are optional. Its structured screen format matches the MediaVerse
theater model:

```json
{
  "externalRef": "theater-2026-10-10",
  "name": "MediaVerse Cinema",
  "location": "Bloomington, Indiana",
  "screens": [{
    "name": "Auditorium 1",
    "format": "IMAX",
    "sound": "Dolby Atmos",
    "seating": "Recliner",
    "capacity": 180
  }]
}
```

The response supplies the stable theater URL. The agent may not set `verified`
on a theater or screen; all agent-created theaters begin unverified. Omitted
optional fields remain untouched. Look up a theater with
`GET /api/agent/theaters?id=<id>` or
`GET /api/agent/theaters?name=...&location=...`.

There is intentionally no delete endpoint. Muse can submit a review-only
request through `POST /api/agent/theaters/delete-suggestions` with
`externalRef`, `reason`, and either `theaterId` or `name` plus `location`.
Suggestions appear at `/admin/muse`; an admin reviews the venue and performs
the actual deletion only from the existing theater admin workspace.
