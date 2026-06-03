import {cookies} from "next/headers";
import {getBackendUrl} from "@/lib/backend";

export async function authenticatedFetch(
    path: string,
    options: RequestInit = {}
){
    const cookieStore = await cookies();
    const token = cookieStore.get("devboard_session")?.value;

    if (!token) {
        throw new Error("UNAUTHENTICATED");
    }
    return fetch(`${getBackendUrl()}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
        }
    );
}