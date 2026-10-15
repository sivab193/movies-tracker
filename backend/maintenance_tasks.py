"""Allowlisted, idempotent database maintenance tasks for admin execution."""

from dataclasses import dataclass
from typing import Any, Callable


LEADERBOARD_ELIGIBLE_FILTER = {
    "$or": [
        {"watchHistory.0": {"$exists": True}},
        {"totalMoviesWatched": {"$gt": 0}},
    ],
    "joinedLeaderboard": {"$ne": True},
    "leaderboardOptOut": {"$ne": True},
    "isBannedFromLeaderboard": {"$ne": True},
}

PRIVATE_WITHOUT_MV_NUMBER_FILTER = {
    "isPublic": {"$ne": True},
    "mvNumber": {"$exists": False},
}


@dataclass(frozen=True)
class MaintenanceTask:
    id: str
    title: str
    description: str
    impact: str
    run: Callable[[Any, bool], dict[str, Any]]

    def public_metadata(self) -> dict[str, str]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "impact": self.impact,
        }


def run_leaderboard_autojoin(database: Any, apply: bool) -> dict[str, Any]:
    eligible = database.users.count_documents(LEADERBOARD_ELIGIBLE_FILTER)
    result: dict[str, Any] = {
        "eligibleUsers": eligible,
        "modifiedUsers": 0,
    }
    if apply and eligible:
        update = database.users.update_many(
            LEADERBOARD_ELIGIBLE_FILTER,
            {"$set": {"joinedLeaderboard": True}},
        )
        result["modifiedUsers"] = update.modified_count
    return result


def run_mv_display_names(database: Any, apply: bool) -> dict[str, Any]:
    taken = {
        int(user["mvNumber"])
        for user in database.users.find(
            {"mvNumber": {"$exists": True}}, {"mvNumber": 1}
        )
        if isinstance(user.get("mvNumber"), int)
    }
    users = list(
        database.users.find(
            PRIVATE_WITHOUT_MV_NUMBER_FILTER,
            {"_id": 1, "displayName": 1},
        ).sort("_id", 1)
    )
    anonymous = sum(
        1 for user in users if (user.get("displayName") or "") == "Anonymous"
    )
    result: dict[str, Any] = {
        "eligibleUsers": len(users),
        "anonymousDefaults": anonymous,
        "namesToOverwrite": len(users) - anonymous,
        "numbersAlreadyTaken": len(taken),
        "modifiedUsers": 0,
        "highestAssignedNumber": max(taken) if taken else None,
    }
    if not apply or not users:
        return result

    number = 1
    for user in users:
        while number in taken:
            number += 1
        database.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"mvNumber": number, "displayName": f"MV #{number}"}},
        )
        taken.add(number)
        number += 1

    highest = max(taken)
    counter = database.counters.find_one({"_id": "userSequence"})
    if not counter or int(counter.get("seq", 0)) < highest:
        database.counters.update_one(
            {"_id": "userSequence"},
            {"$set": {"seq": highest}},
            upsert=True,
        )

    result["modifiedUsers"] = len(users)
    result["highestAssignedNumber"] = highest
    return result


TASKS = {
    task.id: task
    for task in (
        MaintenanceTask(
            id="leaderboard-autojoin",
            title="Leaderboard auto-join",
            description=(
                "Join eligible users who have watch history and have not opted out "
                "or been banned."
            ),
            impact="Updates joinedLeaderboard for eligible accounts.",
            run=run_leaderboard_autojoin,
        ),
        MaintenanceTask(
            id="mv-display-names",
            title="MV display names",
            description=(
                "Assign MV #N identities to existing private profiles in signup order."
            ),
            impact="Overwrites existing display names for eligible private profiles.",
            run=run_mv_display_names,
        ),
    )
}


def list_tasks() -> list[dict[str, str]]:
    return [task.public_metadata() for task in TASKS.values()]


def run_task(task_id: str, database: Any, apply: bool) -> dict[str, Any]:
    task = TASKS.get(task_id)
    if task is None:
        raise KeyError(task_id)
    return task.run(database, apply)
