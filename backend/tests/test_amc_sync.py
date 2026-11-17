import unittest
from unittest.mock import MagicMock

from services.amc_sync import sync_movie_catalog


class AMCSyncTests(unittest.TestCase):
    def test_low_confidence_match_is_queued_for_review(self):
        database = MagicMock()
        database.movies.find.return_value = [{"_id": "local-1", "title": "Hero", "year": 2026}]
        client = MagicMock()
        client.get_now_playing.return_value = {"items": [{"id": 10, "name": "Hero", "releaseDateUtc": "2026-01-01"}]}
        client.get_coming_soon.return_value = {"items": []}

        result = sync_movie_catalog(database, client)

        self.assertEqual(result, {"seen": 1, "matched": 0, "queued": 1})
        database.movies.update_one.assert_not_called()
        update = database.amc_match_queue.update_one.call_args.args[1]["$set"]
        self.assertEqual(update["suggestedMovieId"], "local-1")
        self.assertEqual(update["suggestedConfidence"], "title-year-low")

    def test_exact_imdb_match_updates_media_verse_movie(self):
        database = MagicMock()
        database.movies.find.return_value = [{"_id": "local-1", "imdbId": "tt123", "title": "Film"}]
        client = MagicMock()
        client.get_now_playing.return_value = {"items": [{"id": 11, "name": "Film", "imdbId": "tt123", "hasScheduledShowtimes": True}]}
        client.get_coming_soon.return_value = {"items": []}

        result = sync_movie_catalog(database, client)

        self.assertEqual(result, {"seen": 1, "matched": 1, "queued": 0})
        update = database.movies.update_one.call_args.args[1]["$set"]
        self.assertEqual(update["amcMovieId"], 11)
        self.assertEqual(update["amcMatchConfidence"], "exact-imdb")


if __name__ == "__main__":
    unittest.main()
