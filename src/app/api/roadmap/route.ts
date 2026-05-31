import { getCurrentUser } from "@/lib/auth-helpers";
import { generateRoadmap, getActiveRoadmap, toggleTask, getProgress } from "@/lib/roadmap";
import { logUsageAction } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    let roadmap = await getActiveRoadmap(user.id);
    let progress = null;
    if (roadmap) {
      progress = await getProgress(roadmap.id);
    }
    return Response.json({ roadmap, progress });
  } catch (error: any) {
    console.error("[ROADMAP] fetch_error", error?.message);
    return Response.json({ error: "Failed to load roadmap" }, { status: 500 });
  }
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    logUsageAction(user.id, "roadmap_created");
    await generateRoadmap(user.id);
    const roadmap = await getActiveRoadmap(user.id);
    const progress = await getProgress(roadmap!.id);
    return Response.json({ roadmap, progress });
  } catch (error: any) {
    console.error("[ROADMAP] generate_error", error?.message);
    return Response.json({ error: "Failed to generate roadmap" }, { status: 500 });
  }
}
