export function getBackendUrl() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_INTERNAL_URL is not configured");
  }

  return backendUrl;
}