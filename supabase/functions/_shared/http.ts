import { corsHeaders } from "./cors.ts";

/**
 * Uniform JSON response helper. Every edge function should use this so the
 * response shape and CORS headers stay consistent across the entire API
 * surface.
 */
export function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}
