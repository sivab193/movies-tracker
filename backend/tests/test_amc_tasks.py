import unittest
from unittest.mock import MagicMock, patch

import maintenance_tasks
from services.amc_client import AMCError


class AMCMaintenanceTaskTests(unittest.TestCase):
    def test_amc_tasks_are_registered(self):
        task_ids = {task["id"] for task in maintenance_tasks.list_tasks()}
        self.assertIn("amc-sync-movies", task_ids)
        self.assertIn("amc-sync-theatres", task_ids)

    @patch.object(maintenance_tasks, "AMCClient")
    def test_movie_task_preview_counts_without_writing(self, client_factory):
        client = client_factory.return_value
        client.get_now_playing.return_value = {"items": [{"id": 11, "name": "Film", "imdbId": "tt123", "hasScheduledShowtimes": True}]}
        client.get_coming_soon.return_value = {"items": []}
        database = MagicMock()
        database.movies.find.return_value = [{"_id": "local-1", "imdbId": "tt123", "title": "Film"}]

        result = maintenance_tasks.run_task("amc-sync-movies", database, apply=False)

        self.assertEqual(result, {"seen": 1, "matched": 1, "queued": 0})
        database.movies.update_one.assert_not_called()

    @patch.object(maintenance_tasks, "AMCClient")
    def test_theatre_task_apply_upserts(self, client_factory):
        client = client_factory.return_value
        client.get_theatres.return_value = {"items": [{"id": 1, "name": "AMC One"}], "page": {}}
        database = MagicMock()

        result = maintenance_tasks.run_task("amc-sync-theatres", database, apply=True)

        self.assertEqual(result, {"synced": 1})
        database.theaters.update_one.assert_called_once()

    @patch.object(maintenance_tasks, "AMCClient")
    def test_task_reports_missing_vendor_key(self, client_factory):
        client_factory.side_effect = AMCError("AMC integration is not configured", status=503)

        result = maintenance_tasks.run_task("amc-sync-movies", MagicMock(), apply=True)

        self.assertEqual(result, {"error": "AMC integration is not configured"})


if __name__ == "__main__":
    unittest.main()
