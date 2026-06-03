import { NextResponse } from "next/server";

/**
 * proxy logic to forward requests to backend with consistent error handling and response formatting
 * This is specifically designed to be used in BFF routes to avoid code duplication and ensure consistent behavior across all proxied endpoints.
 * @warning This is for those route that only forward data to backend and return the response 
 * @param url - the full URL to the backend endpoint 
 * @param options - an object containing the request options
 * @returns a NextResponse object containing the JSON data from backend and appropriate status code, or a standardized error response in case of failure
 */

interface ProxyOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
}

export async function proxyRequest(
  url: string,
  options: ProxyOptions = {}
) {
  const {
    method = "GET",
    body,
    headers,
    timeoutMs = 10000,
  } = options;

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    let data;

    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: "Invalid backend response",
      };
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request timed out",
        },
        { status: 504 }
      );
    }

    console.error("Proxy request error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Backend service unavailable",
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}