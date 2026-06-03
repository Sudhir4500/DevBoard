import { NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/server-auth-fetch";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ success: false, message: "project_id is required" }, { status: 400 });
    }

    const response = await authenticatedFetch(`/api/v1/issues?project_id=${projectId}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await authenticatedFetch("/api/v1/issues", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Failed to create issue" }, { status: 500 });
  }
}
