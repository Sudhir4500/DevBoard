import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "devboard_session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out" },
    message: "Logged out",
  });

  // Ensure the browser clears the cookie even if delete() options do not match.
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
