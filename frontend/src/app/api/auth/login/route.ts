/**
 * @fileoverview Login BFF route.
 * Proxies authentication requests to the backend API and stores
 * the JWT inside a secure HttpOnly cookie.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Token } from "@/types/auth";
import { getBackendUrl } from "@/lib/backend";

const COOKIE_NAME = "devboard_session";
const REQUEST_TIMEOUT_MS = 10_000;

export async function POST(request: Request) {
  try {
    // Ensure backend URL exists
    const backendUrl = getBackendUrl();

    // Parse request body
    const body = await request.json();

    const email =
      typeof body?.email === "string" ? body.email.trim() : "";

    const password =
      typeof body?.password === "string" ? body.password : "";

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Email and password are required",
            },
          ],
        },
        { status: 400 }
      );
    }

    // FastAPI OAuth2PasswordRequestForm expects:
    // username=<email>&password=<password>
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    // Add timeout protection
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle backend errors safely
    if (!response.ok) {
      let errorData: { message?: string; errors?: Array<{ code: string; message: string }> } | null = null;

      try {
        errorData = await response.json();
      } catch {
        // Backend may have returned HTML/plain text
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData?.message ?? "Login failed",
          errors:
            errorData?.errors ??
            [
              {
                code: "LOGIN_FAILED",
                message: `Authentication failed (${response.status})`,
              },
            ],
        },
        {
          status: response.status,
        }
      );
    }

    // Parse token response; FastAPI wraps the token inside `data`
    const tokenResponse = await response.json();
    const tokenData: Token = tokenResponse?.data;

    if (!tokenData?.access_token) {
      throw new Error("Backend returned an invalid token response");
    }

    // Store JWT in secure HttpOnly cookie
    const cookieStore = await cookies();

    cookieStore.set({
      name: COOKIE_NAME,
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenData.expires_in,
      priority: "high",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Authentication successful",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Timeout-specific response
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication service timed out",
          errors: [
            {
              code: "REQUEST_TIMEOUT",
              message: "Please try again later",
            },
          ],
        },
        { status: 504 }
      );
    }

    console.error("Login route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        errors: [
          {
            code: "INTERNAL_SERVER_ERROR",
            message:
              process.env.NODE_ENV === "development"
                ? error instanceof Error
                  ? error.message
                  : "Unknown error"
                : "Something went wrong",
          },
        ],
      },
      { status: 500 }
    );
  }
}