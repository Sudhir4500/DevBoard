import { NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/server-auth-fetch";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await authenticatedFetch(`/api/v1/issues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const response = await authenticatedFetch(`/api/v1/issues/${id}`, {
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
        data ?? { success: false, message: "Failed to delete issue" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Failed to delete issue" }, { status: 500 });
  }
}
