import { getCurrentUser } from "@/lib/auth-helpers";
import { toggleTask } from "@/lib/roadmap";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const { taskId } = await request.json();
    const result = await toggleTask(taskId, user.id);
    if (!result) return Response.json({ error: "Task not found" }, { status: 404 });
    return Response.json(result);
  } catch (error: any) {
    console.error("[ROADMAP] task_error", error?.message);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}
