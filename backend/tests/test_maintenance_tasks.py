import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock

from pymongo import ReturnDocument

from maintenance_tasks import run_leaderboard_autojoin, run_mv_display_names


class Cursor(list):
    def sort(self, *_args):
        return self


class MaintenanceTaskTests(unittest.TestCase):
    def test_leaderboard_preview_does_not_write(self):
        database = SimpleNamespace(users=MagicMock())
        database.users.count_documents.return_value = 14

        result = run_leaderboard_autojoin(database, apply=False)

        self.assertEqual(result, {"eligibleUsers": 14, "modifiedUsers": 0})
        database.users.update_many.assert_not_called()

    def test_leaderboard_apply_reports_modified_users(self):
        database = SimpleNamespace(users=MagicMock())
        database.users.count_documents.return_value = 4
        database.users.update_many.return_value.modified_count = 4

        result = run_leaderboard_autojoin(database, apply=True)

        self.assertEqual(result["modifiedUsers"], 4)
        database.users.update_many.assert_called_once()

    def test_mv_preview_reports_overwrites_without_writing(self):
        users = MagicMock()
        users.find.side_effect = [
            Cursor([{"mvNumber": 1}]),
            Cursor([
                {"_id": 10, "displayName": "Anonymous"},
                {"_id": 20, "displayName": "Custom name"},
            ]),
        ]
        database = SimpleNamespace(users=users, counters=MagicMock())

        result = run_mv_display_names(database, apply=False)

        self.assertEqual(result["eligibleUsers"], 2)
        self.assertEqual(result["anonymousDefaults"], 1)
        self.assertEqual(result["namesToOverwrite"], 1)
        users.update_one.assert_not_called()

    def test_mv_apply_reserves_numbers_before_assigning_users(self):
        users = MagicMock()
        users.find.side_effect = [
            Cursor([{"mvNumber": 1}]),
            Cursor([{"_id": 10, "displayName": "Anonymous"}]),
        ]
        counters = MagicMock()
        counters.find_one_and_update.return_value = {
            "_id": "userSequence",
            "seq": 2,
        }
        users.update_one.side_effect = lambda *_args, **_kwargs: self.assertTrue(
            counters.find_one_and_update.called
        )
        database = SimpleNamespace(users=users, counters=counters)

        result = run_mv_display_names(database, apply=True)

        counters.find_one_and_update.assert_called_once_with(
            {"_id": "userSequence"},
            [
                {
                    "$set": {
                        "seq": {
                            "$add": [
                                {"$max": [{"$ifNull": ["$seq", 0]}, 1]},
                                1,
                            ]
                        }
                    }
                }
            ],
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        users.update_one.assert_called_once_with(
            {"_id": 10},
            {"$set": {"mvNumber": 2, "displayName": "MV #2"}},
        )
        self.assertEqual(result["highestAssignedNumber"], 2)


if __name__ == "__main__":
    unittest.main()
