import { NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/server-auth-fetch";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const response = await authenticatedFetch(`/api/v1/projects/${id}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Failed to fetch project" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const response = await authenticatedFetch(`/api/v1/projects/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      return NextResponse.json(
        data ?? { success: false, message: "Failed to delete project" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: "Project deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Failed to delete project" }, { status: 500 });
  }
}
