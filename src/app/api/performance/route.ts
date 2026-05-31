import { getCurrentUser } from "@/lib/auth-helpers";
import { getPerformanceData, createSnapshot } from "@/lib/performance";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  try {
    const data = await getPerformanceData(user.id);
    return Response.json(data);
  } catch (error: any) {
    console.error("[PERFORMANCE] fetch_error", error?.message);
    return Response.json({ error: "Failed to load performance data" }, { status: 500 });
  }
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to continue" }, { status: 401 });
  }

  try {
    await createSnapshot(user.id, "combined");
    const data = await getPerformanceData(user.id);
    return Response.json(data);
  } catch (error: any) {
    console.error("[PERFORMANCE] snapshot_error", error?.message);
    return Response.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}
