"""Admin-only endpoints for explicitly registered maintenance tasks."""

from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from maintenance_tasks import TASKS, list_tasks, run_task
from mongo_config import db
from routes.movies import get_authenticated_uid, is_admin


admin_maintenance_bp = Blueprint("admin_maintenance", __name__)


def _require_admin():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "Admin authentication required"}), 401)
    token = auth_header.split(" ", 1)[1]
    if not is_admin(token):
        return None, (jsonify({"error": "Forbidden: Admin access required"}), 403)
    return get_authenticated_uid(request), None


@admin_maintenance_bp.get("/tasks")
def get_tasks():
    _, error = _require_admin()
    if error:
        return error
    if db is None:
        return jsonify({"error": "Database unavailable"}), 503
    return jsonify({"tasks": list_tasks()})


@admin_maintenance_bp.post("/tasks/<task_id>/run")
def execute_task(task_id: str):
    admin_uid, error = _require_admin()
    if error:
        return error
    if db is None:
        return jsonify({"error": "Database unavailable"}), 503

    task = TASKS.get(task_id)
    if task is None:
        return jsonify({"error": "Unknown maintenance task"}), 404

    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", "preview")
    if mode not in {"preview", "apply"}:
        return jsonify({"error": "Mode must be preview or apply"}), 400
    if mode == "apply" and payload.get("confirmation") != task_id:
        return jsonify({"error": f"Confirmation must exactly match {task_id}"}), 400

    try:
        output = run_task(task_id, db, apply=mode == "apply")
        result = {
            "taskId": task_id,
            "mode": mode,
            "status": "completed",
            "completedAt": datetime.now(timezone.utc).isoformat(),
            "output": output,
        }
        try:
            db.maintenance_runs.insert_one(
                {
                    **result,
                    "adminUid": admin_uid,
                    "completedAt": datetime.now(timezone.utc),
                }
            )
        except Exception:
            current_app.logger.exception("Failed to record maintenance task audit entry")
        return jsonify(result)
    except Exception:
        current_app.logger.exception("Maintenance task %s failed", task_id)
        return jsonify({"error": "Maintenance task failed. Check server logs and try again."}), 500
