import { useState, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { signInWithPassword } from "@/services/auth";
import { getMyProfileFields } from "@/services/profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { upsertAccount } from "@/lib/accountVault";
import { SEO } from "@/components/SEO";
import { lovable } from "@/integrations/lovable";

export default function Login() {
  const { session, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // `add=1` indicates we're stacking another account on top of an existing session
  const isAddingAccount = searchParams.get("add") === "1";

  // Pre-fill username from URL param (for account switching)
  useEffect(() => {
    const username = searchParams.get("username");
    if (username) setEmail(username);
  }, [searchParams]);

  // If already signed in and we're NOT trying to add another account, bounce home
  if (!authLoading && session && !isAddingAccount) {
    return <Navigate to="/studio" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your credentials.");
      return;
    }

    let loginEmail = email.trim();
    if (!loginEmail.includes("@")) {
      loginEmail = `${loginEmail}@internal.brandtonic`;
    }

    setLoading(true);
    try {
      const { session: newSession } = await signInWithPassword(loginEmail, password);

      // Persist this session into the multi-account vault. Supabase storage
      // now holds this session as the active one; previous accounts remain
      // available via the vault for instant switching.
      const usernameGuess = email.trim().includes("@")
        ? email.trim().split("@")[0]
        : email.trim();
      const profile = await getMyProfileFields(newSession.user.id, ["username", "display_name"]);
      upsertAccount(newSession, {
        username: profile?.username || usernameGuess,
        displayName: profile?.display_name || undefined,
      });
      navigate("/studio", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(220 80% 97%), hsl(45 96% 97%), hsl(220 72% 95%))" }}
    >
      <SEO
        title="Sign in — B Design by Because"
        description="Sign in to your B Design workspace to generate on‑brand AI ad creatives. Accounts are admin-issued by Because."
        path="/login"
        index={false}
      />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, hsl(45 96% 80%), transparent 70%)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(220 72% 80%), transparent 70%)" }} />

      <Card className="w-full max-w-sm glass border-border/50 shadow-xl relative z-10">
        <CardContent className="pt-10 pb-10 px-8 space-y-7">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo-icon.png" alt="B Design" className="h-11 w-11 rounded-2xl object-contain" />
            <span className="font-display font-bold text-2xl text-foreground tracking-tight">B Design</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {isAddingAccount
              ? "Add another account. Your existing session stays signed in."
              : "Sign in with your account credentials."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-sm font-semibold rounded-xl gap-2"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) throw result.error;
                if (result.redirected) return;
                navigate("/studio", { replace: true });
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Google sign-in failed.";
                toast.error(msg);
                setLoading(false);
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Username or Email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={loading}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-xl gradient-primary hover:gradient-primary-hover text-primary-foreground"
              disabled={loading}
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</> : isAddingAccount ? "Add Account" : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Accounts are created by your admin. Contact your administrator for access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
