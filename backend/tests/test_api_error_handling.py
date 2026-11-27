import unittest

from app import app


@app.route("/api/test-boom")
def _test_boom():
    raise RuntimeError("boom")


class ApiErrorHandlingTests(unittest.TestCase):
    """The /api/* surface must never answer with Flask's HTML error pages."""

    def setUp(self):
        self.client = app.test_client()

    def test_unknown_api_route_is_json_404(self):
        response = self.client.get("/api/no-such-route")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(response.content_type.startswith("application/json"))
        self.assertIn("error", response.get_json())

    def test_unhandled_api_exception_is_json_500(self):
        response = self.client.get("/api/test-boom")
        self.assertEqual(response.status_code, 500)
        self.assertTrue(response.content_type.startswith("application/json"))
        self.assertEqual(response.get_json()["error"], "Internal server error")

    def test_non_api_404_stays_html(self):
        response = self.client.get("/no-such-page")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(response.content_type.startswith("text/html"))


if __name__ == "__main__":
    unittest.main()
