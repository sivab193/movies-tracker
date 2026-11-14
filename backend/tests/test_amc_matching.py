import unittest

from services.amc_matching import match_amc_movie, normalize_title


class AMCMatchingTests(unittest.TestCase):
    def test_imdb_match_wins(self):
        candidates = [{"_id": "right", "imdbId": "tt123", "title": "Different title"}]
        match, confidence = match_amc_movie({"imdbId": "tt123", "name": "Film"}, candidates)
        self.assertEqual(match["_id"], "right")
        self.assertEqual(confidence, "exact-imdb")

    def test_matches_normalized_indian_title_year_and_runtime(self):
        candidates = [{"_id": "right", "title": "Jailer 2", "year": "2026", "runtime": "168 min"}]
        match, confidence = match_amc_movie(
            {"name": "Jailer: 2", "releaseDateUtc": "2026-08-14T00:00:00Z", "runTime": 170}, candidates
        )
        self.assertEqual(match["_id"], "right")
        self.assertEqual(confidence, "title-year-runtime")

    def test_does_not_guess_ambiguous_title_year(self):
        candidates = [
            {"_id": "one", "title": "Hero", "year": 2026},
            {"_id": "two", "title": "Hero", "year": 2026},
        ]
        self.assertEqual(match_amc_movie({"name": "Hero", "year": 2026}, candidates), (None, None))
        self.assertEqual(normalize_title("Vikram – Part II"), "vikram part ii")


if __name__ == "__main__":
    unittest.main()
