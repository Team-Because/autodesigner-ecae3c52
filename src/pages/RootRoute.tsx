import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Home from "@/pages/marketing/Home";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

/**
 * Root route is dual-purpose:
 * - Logged-out visitors see the public marketing home (good for SEO).
 * - Logged-in users are bounced into the Studio app shell.
 */
export default function RootRoute() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/studio" replace />;

  return (
    <MarketingLayout>
      {/* MarketingLayout renders <Outlet />; we're rendering Home directly via children pattern below */}
    </MarketingLayout>
  );
}
