import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";
import { requireAdmin, serviceClient } from "../_shared/auth.ts";

serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const authed = await requireAdmin(req);
    if (authed instanceof Response) return authed;

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) return errorResponse("userId and newPassword are required", 400);
    if (newPassword.length < 6) return errorResponse("Password must be at least 6 characters", 400);

    const admin = serviceClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateError) return errorResponse(updateError.message, 400);

    return jsonResponse({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return errorResponse(msg, 500);
  }
});
