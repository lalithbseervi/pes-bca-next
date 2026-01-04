import { respondWithCookies } from "@/lib/cookies.js";
import { supabase } from "@/lib/supabase";
import { AuthenticationService } from "@/lib/services/AuthenticationService.js";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Initialize authentication service
    const auth_service = AuthenticationService.create(
      supabase,
      process.env.NEXT_PUBLIC_AUTH_ENDPOINT
    );

    // Perform authentication
    const session_profile = await auth_service.authenticate(
      username,
      password,
      request.headers.get("user-agent")
    );

    // If authentication service returns a Response object (error case), return it directly
    if (session_profile instanceof Response) {
      return session_profile;
    }

    return respondWithCookies(
      session_profile.access_token,
      session_profile.refresh_token,
      request,
      session_profile
    );
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.message === "Invalid credentials") {
      return new Response(
        JSON.stringify({ success: false, message: "invalid credentials" }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Authentication failed" }),
      { status: 401 }
    );
  }
}
