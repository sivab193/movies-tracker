import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from flask import Flask

from routes.admin_maintenance import admin_maintenance_bp


class AdminMaintenanceRouteTests(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(admin_maintenance_bp, url_prefix="/api/admin/maintenance")
        self.client = app.test_client()

    def test_tasks_require_authentication(self):
        response = self.client.get("/api/admin/maintenance/tasks")

        self.assertEqual(response.status_code, 401)

    @patch("routes.admin_maintenance.is_admin", return_value=False)
    def test_tasks_reject_non_admin(self, _is_admin):
        response = self.client.get(
            "/api/admin/maintenance/tasks",
            headers={"Authorization": "Bearer token"},
        )

        self.assertEqual(response.status_code, 403)

    @patch("routes.admin_maintenance.get_authenticated_uid", return_value="admin-1")
    @patch("routes.admin_maintenance.is_admin", return_value=True)
    @patch("routes.admin_maintenance.db", SimpleNamespace())
    def test_apply_requires_exact_confirmation(self, _is_admin, _uid):
        response = self.client.post(
            "/api/admin/maintenance/tasks/leaderboard-autojoin/run",
            headers={"Authorization": "Bearer token"},
            json={"mode": "apply", "confirmation": "wrong"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("exactly match", response.get_json()["error"])

    @patch("routes.admin_maintenance.get_authenticated_uid", return_value="admin-1")
    @patch("routes.admin_maintenance.is_admin", return_value=True)
    @patch("routes.admin_maintenance.run_task", return_value={"eligibleUsers": 3})
    def test_preview_returns_structured_output(self, run_task_mock, _is_admin, _uid):
        fake_db = SimpleNamespace(maintenance_runs=MagicMock())
        with patch("routes.admin_maintenance.db", fake_db):
            response = self.client.post(
                "/api/admin/maintenance/tasks/leaderboard-autojoin/run",
                headers={"Authorization": "Bearer token"},
                json={"mode": "preview"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["output"]["eligibleUsers"], 3)
        run_task_mock.assert_called_once_with(
            "leaderboard-autojoin", fake_db, apply=False
        )
        fake_db.maintenance_runs.insert_one.assert_called_once()


if __name__ == "__main__":
    unittest.main()
