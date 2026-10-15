import { auth } from "@/lib/firebase"
import { API_BASE_URL } from "@/services/api"

export type MaintenanceTask = {
  id: string
  title: string
  description: string
  impact: string
}

export type MaintenanceRun = {
  taskId: string
  mode: "preview" | "apply"
  status: "completed"
  completedAt: string
  output: Record<string, number | string | null>
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth?.currentUser?.getIdToken()
  if (!token) throw new Error("Admin authentication is required")

  const response = await fetch(`${API_BASE_URL}/admin/maintenance${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || "Maintenance request failed")
  return body
}

export async function getMaintenanceTasks(): Promise<MaintenanceTask[]> {
  const response = await adminRequest<{ tasks: MaintenanceTask[] }>("/tasks")
  return response.tasks
}

export function runMaintenanceTask(
  taskId: string,
  mode: "preview" | "apply",
): Promise<MaintenanceRun> {
  return adminRequest(`/tasks/${encodeURIComponent(taskId)}/run`, {
    method: "POST",
    body: JSON.stringify({
      mode,
      ...(mode === "apply" ? { confirmation: taskId } : {}),
    }),
  })
}
