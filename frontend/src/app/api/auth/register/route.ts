import { getBackendUrl } from "@/lib/backend";
import { proxyRequest } from "@/lib/api-proxy";

export async function POST(request: Request) {
  const body = await request.json();

  return proxyRequest(
    `${getBackendUrl()}/api/v1/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }
  );
}