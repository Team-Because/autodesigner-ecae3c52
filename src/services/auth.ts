import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SignInResult {
  session: Session;
}

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("Sign-in returned no session");
  return { session: data.session };
}

export async function refreshWithToken(refreshToken: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return null;
  return data.session;
}

export async function setActiveSession(
  accessToken: string,
  refreshToken: string,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session) return null;
  return data.session;
}
