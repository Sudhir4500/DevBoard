import { NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/server-auth-fetch";

export async function GET() {
    try {
        const response = await authenticatedFetch("/api/v1/auth/me");
        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHENTICATED") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Not authenticated",
                },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch user info",
            },
            { status: 500 }
        );
    }
}