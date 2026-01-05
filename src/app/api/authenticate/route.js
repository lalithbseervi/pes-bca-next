import { respondWithCookies } from "@/lib/cookies.js";
import { supabase } from "@/lib/supabase";
import { AuthenticationService } from "@/lib/services/AuthenticationService.js";
import { createLogger } from "@/lib/logger";

const log = createLogger('authentication_handler');

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Initialize authentication service
    const auth_service = AuthenticationService.create(
      supabase,
      process.env.NEXT_PUBLIC_AUTH_ENDPOINT
    );

    // Perform authentication
    const result = await auth_service.authenticate(
      username,
      password,
      request.headers.get("user-agent")
    );

    // If authentication service returns a Response object (error case), return it directly
    if (result instanceof Response) {
      return result;
    }

    const { profile, access_token, refresh_token } = result;

    return respondWithCookies(
      access_token,
      refresh_token,
      request,
      profile
    );
  } catch (error) {
    log.error("Authentication error:", error);

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
