"""Small, server-only client for AMC's catalog APIs.

The client deliberately knows nothing about Flask or MongoDB.  That keeps the
HTTP boundary easy to test with recorded response fixtures and prevents the
vendor key from ever crossing into an API response.
"""

from __future__ import annotations

import datetime as dt
import os
import time
from typing import Any, Dict, Iterable, List, Optional

import requests


AMC_BASE_URL = "https://api.amctheatres.com/v2"
AMC_USER_AGENT = "MediaVerse/1.0 (+https://www.media-verse.in)"


class AMCError(RuntimeError):
    """A safe representation of an AMC API failure."""

    def __init__(self, message: str, *, status: int = 502, code: Optional[int] = None):
        super().__init__(message)
        self.status = status
        self.code = code

    @property
    def is_empty_result(self) -> bool:
        return self.code == 5217


def _parse_error(response: requests.Response) -> AMCError:
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    code = payload.get("code") or payload.get("errorCode")
    try:
        code = int(code) if code is not None else None
    except (TypeError, ValueError):
        code = None
    messages = {
        12005: "AMC credentials were rejected",
        12004: "This AMC endpoint is not enabled",
        5217: "No AMC showtimes were found",
        5216: "AMC could not find that record",
        5301: "AMC could not find that record",
        5308: "AMC rejected an invalid request",
    }
    status = 404 if code in {5216, 5217, 5301} else 502
    return AMCError(messages.get(code, "AMC is temporarily unavailable"), status=status, code=code)


def _embedded_items(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    embedded = payload.get("_embedded") or {}
    if isinstance(embedded, list):
        return [item for item in embedded if isinstance(item, dict)]
    if isinstance(embedded, dict):
        for value in embedded.values():
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    for key in ("showtimes", "movies", "theatres", "items"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _iso(value: Any) -> Optional[str]:
    if not value:
        return None
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return dt.datetime.fromisoformat(text).isoformat()
    except ValueError:
        return str(value)


def _money_to_cents(value: Any) -> Optional[int]:
    try:
        return int(round(float(value) * 100))
    except (TypeError, ValueError):
        return None


def _normalize_prices(prices: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result = []
    for price in prices or []:
        cents = _money_to_cents(price.get("price"))
        if cents is None:
            continue
        result.append({
            "type": price.get("type"),
            "priceCents": cents,
            "taxCents": _money_to_cents(price.get("tax")),
            "currency": "USD",
        })
    return result


def normalize_showtime(item: Dict[str, Any]) -> Dict[str, Any]:
    languages = item.get("languages") or {}
    if isinstance(languages, list):
        languages = languages[0] if languages else {}
    premium_format = item.get("premiumFormat")
    if isinstance(premium_format, dict):
        premium_format = premium_format.get("name") or premium_format.get("code")
    return {
        "id": str(item.get("id") or ""),
        "movieId": item.get("movieId"),
        "movieName": item.get("movieName"),
        "theatreId": item.get("theatreId"),
        "showDateTimeUtc": _iso(item.get("showDateTimeUtc")),
        "showDateTimeLocal": _iso(item.get("showDateTimeLocal")),
        "sellUntilDateTimeUtc": _iso(item.get("sellUntilDateTimeUtc")),
        "lastUpdatedDateUtc": _iso(item.get("lastUpdatedDateUtc")),
        "auditorium": item.get("auditorium"),
        "premiumFormat": premium_format or None,
        "attributes": [
            {"code": attr.get("code"), "name": attr.get("name")}
            for attr in item.get("attributes") or [] if isinstance(attr, dict)
        ],
        "languages": {
            "spoken": languages.get("spoken"),
            "dubbedOver": languages.get("dubbedOver"),
            "subtitle": languages.get("subtitle"),
        },
        "ticketPrices": _normalize_prices(item.get("ticketPrices") or []),
        "estimatedFees": _normalize_prices(item.get("estimatedFees") or []),
        "isSoldOut": bool(item.get("isSoldOut")),
        "isAlmostSoldOut": bool(item.get("isAlmostSoldOut")),
        "isCanceled": bool(item.get("isCanceled")),
        "isDiscountMatineePriced": bool(item.get("isDiscountMatineePriced")),
        "discountMatineeMessage": item.get("discountMatineeMessage"),
        "purchaseUrl": item.get("purchaseUrl") or item.get("mobilePurchaseUrl"),
    }


def normalize_theatre(item: Dict[str, Any]) -> Dict[str, Any]:
    location = item.get("location") or item.get("locationRepresentation") or {}
    address = location.get("address") or {}
    if not isinstance(address, dict):
        address = {"line1": str(address)}
    state = location.get("state") or {}
    if isinstance(state, str):
        state = {"code": state}
    return {
        "id": item.get("id"),
        "slug": item.get("slug"),
        "name": item.get("name"),
        "chain": "AMC",
        "location": {
            "address": address.get("line1") or address.get("address1") or location.get("addressLine1"),
            "city": location.get("city"),
            "state": state.get("code") or state.get("name"),
            "postalCode": location.get("postalCode"),
            "lat": location.get("latitude"),
            "lon": location.get("longitude"),
        },
        "market": (location.get("market") or {}).get("name") if isinstance(location.get("market"), dict) else location.get("market"),
        "timezone": item.get("timeZone") or item.get("timezone"),
        "attributes": item.get("attributes") or [],
        "websiteUrl": item.get("websiteUrl") or item.get("showtimesUrl"),
    }


def normalize_movie(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "slug": item.get("slug"),
        "imdbId": item.get("imdbId"),
        "runTime": item.get("runTime"),
        "genre": item.get("genre"),
        "mpaaRating": item.get("mpaaRating"),
        "score": item.get("score"),
        "releaseDateUtc": _iso(item.get("releaseDateUtc")),
        "earliestShowingUtc": _iso(item.get("earliestShowingUtc")),
        "onlineTicketAvailabilityDateUtc": _iso(item.get("onlineTicketAvailabilityDateUtc")),
        "hasScheduledShowtimes": bool(item.get("hasScheduledShowtimes")),
        "showtimesUrl": item.get("showtimesUrl"),
    }


class AMCClient:
    def __init__(self, vendor_key: Optional[str] = None, session: Optional[requests.Session] = None):
        self.vendor_key = vendor_key or os.environ.get("AMC_VENDOR_KEY")
        self.session = session or requests.Session()
        if not self.vendor_key:
            raise AMCError("AMC integration is not configured", status=503)

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{AMC_BASE_URL}/{path.lstrip('/')}"
        headers = {"X-AMC-Vendor-Key": self.vendor_key, "User-Agent": AMC_USER_AGENT, "Accept": "application/json"}
        for attempt in range(2):
            try:
                response = self.session.get(
                    url, params=params, headers=headers, timeout=20, allow_redirects=False
                )
            except requests.Timeout as exc:
                if attempt == 0:
                    continue
                raise AMCError("AMC timed out", status=504) from exc
            except requests.RequestException as exc:
                raise AMCError("AMC is temporarily unavailable") from exc
            if response.status_code in {429, 500, 502, 503, 504} and attempt == 0:
                time.sleep(0.1)
                continue
            if not 200 <= response.status_code < 300:
                raise _parse_error(response)
            try:
                return response.json()
            except ValueError as exc:
                raise AMCError("AMC returned an invalid response") from exc
        raise AMCError("AMC is temporarily unavailable")

    def _list(self, path: str, params: Optional[Dict[str, Any]], normalizer):
        payload = self._get(path, params)
        return {"items": [normalizer(item) for item in _embedded_items(payload)], "page": payload.get("page") or {}}

    def get_theatres(self, **params):
        return self._list("theatres", params, normalize_theatre)

    def get_theatre(self, theatre_id):
        return normalize_theatre(self._get(f"theatres/{theatre_id}"))

    def get_movie_by_name(self, name):
        return self._list("movies", {"name": name}, normalize_movie)

    def get_movie(self, movie_id):
        return normalize_movie(self._get(f"movies/{movie_id}"))

    def get_now_playing(self, **params):
        return self._list("movies/views/now-playing", params, normalize_movie)

    def get_coming_soon(self, **params):
        return self._list("movies/views/coming-soon", params, normalize_movie)

    def get_special_events(self, **params):
        return self._list("movies/views/special-events", params, normalize_movie)

    def get_showtimes_by_theatre(self, theatre_id, date=None, **params):
        suffix = f"/{date}" if date else ""
        return self._list(f"theatres/{theatre_id}/showtimes{suffix}", params, normalize_showtime)

    def get_showtimes_near(self, date, lat, lon, **params):
        return self._list(f"showtimes/views/current-location/{date}/{lat}/{lon}", params, normalize_showtime)

    def get_showtime(self, showtime_id):
        return normalize_showtime(self._get(f"showtimes/{showtime_id}"))

    def get_earliest_showtime(self, theatre_id, movie_id):
        return normalize_showtime(self._get(f"theatres/{theatre_id}/movies/{movie_id}/earliest-showtime"))
