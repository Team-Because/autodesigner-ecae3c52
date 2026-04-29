import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

/** Redirect logged-in users away from public/marketing pages into the app. */
export function RedirectIfAuthed({ to = "/studio" }: { to?: string }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to={to} replace />;
  return <Outlet />;
}
