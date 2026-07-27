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

    const { email, password, displayName, role } = await req.json();
    if (!email || !password) return errorResponse("Email and password are required", 400);
    if (password.length < 6) return errorResponse("Password must be at least 6 characters", 400);

    const admin = serviceClient();
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName || "" },
    });
    if (createError) return errorResponse(createError.message, 400);

    const assignRole = role === "admin" ? "admin" : "user";
    await admin.from("user_roles").insert({ user_id: newUser.user!.id, role: assignRole });

    if (displayName) {
      await admin.from("profiles").update({ display_name: displayName }).eq("user_id", newUser.user!.id);
    }

    return jsonResponse({
      success: true,
      user: {
        id: newUser.user!.id,
        email: newUser.user!.email,
        role: assignRole,
        displayName: displayName || "",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return errorResponse(msg, 500);
  }
});
