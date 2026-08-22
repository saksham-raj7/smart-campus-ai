"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Brand } from "@/components/app-shell/brand";

type Mode = "student" | "admin";

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.7 2.9-4.2 2.9-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.35L15.3 16.9c-.87.58-1.98.92-3.3.92-2.54 0-4.7-1.72-5.48-4.03H3.27v2.6A9.74 9.74 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.52 13.8A5.86 5.86 0 0 1 6.21 12c0-.62.11-1.22.31-1.8V7.6H3.27A9.75 9.75 0 0 0 2.25 12c0 1.58.38 3.08 1.02 4.4l3.25-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.18c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.27 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.73 5.35l3.25 2.6C7.3 7.9 9.46 6.18 12 6.18Z"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 fill-current"
      aria-hidden="true"
    >
      <path d="M12 2.1A9.9 9.9 0 0 0 8.87 21.4c.5.1.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.52 1.03 1.52 1.03.88 1.52 2.32 1.08 2.88.82.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.72 1.02A9.46 9.46 0 0 1 12 5.84c.85 0 1.7.11 2.5.34 1.88-1.28 2.72-1.02 2.72-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.33 4.68-4.56 4.93.36.31.68.91.68 1.84v2.72c0 .26.18.58.69.48A9.9 9.9 0 0 0 12 2.1Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [mode, setMode] = useState<Mode>("student");
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = mode === "admin";

  useEffect(() => {
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError(
        oauthError === "OAuth authentication failed"
          ? oauthError
          : "Authentication failed. Please try again."
      );
    }
  }, [searchParams]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (!email.includes("@") || password.length < 4) {
      setError(
        "Enter a valid email and a password with at least 4 characters."
      );
      return;
    }

    setLoading(true);

    try {
      if (signup) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim() || email.split("@")[0],
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setError(
          "Account created. Check your email if confirmation is required, then sign in."
        );
        setSignup(false);
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!data.user) {
        setError("Unable to authenticate this account.");
        return;
      }

      router.replace(isAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "github") {
    setError("");
    setLoading(true);

    try {
      const redirectTo =
        `${window.location.origin}/auth/callback?next=` +
        encodeURIComponent(isAdmin ? "/admin" : "/dashboard");

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError("Unable to start authentication. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-slate-50 lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 top-16 size-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-80 rounded-full bg-violet-500/15 blur-3xl" />

        <Brand />

        <div className="relative my-auto max-w-xl">
          <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-indigo-200">
            CAREER INTELLIGENCE
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-[1.08] tracking-[-.04em]">
            Build the skills that move your career forward.
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Personalized learning, interview practice, and readiness
            intelligence in one focused workspace.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          Private, role-aware career intelligence.
        </p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode("student");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                !isAdmin
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <GraduationCap className="size-4" />
              Student
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("admin");
                setSignup(false);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isAdmin
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Building2 className="size-4" />
              Placement Officer
            </button>
          </div>

          <p className="mt-8 text-xs font-bold tracking-wider text-primary">
            {isAdmin ? "RESTRICTED ACCESS" : "WELCOME TO SKILLORA"}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {isAdmin
              ? "Placement Command Center"
              : signup
                ? "Create your career profile"
                : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isAdmin
              ? "Sign in with an institution-authorized account. Selecting this mode never grants access."
              : "Sign in to keep building your career momentum."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {signup && (
              <label className="block text-sm font-medium">
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-3 focus:ring-ring/30"
                  placeholder="Your name"
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-3 focus:ring-ring/30"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium">
              Password

              <div className="relative mt-1.5">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                  type={show ? "text" : "password"}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-10 font-normal outline-none focus:ring-3 focus:ring-ring/30"
                  placeholder="At least 4 characters"
                />

                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive"
              >
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {loading
                ? "Authenticating…"
                : isAdmin
                  ? "Sign in securely"
                  : signup
                    ? "Create account"
                    : "Sign in"}

              <ArrowRight className="size-4" />
            </button>
          </form>

          {!isAdmin && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                or continue with
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => oauth("google")}
                  aria-label="Continue with Google"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <GoogleMark />
                  Continue with Google
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => oauth("github")}
                  aria-label="Continue with GitHub"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <GitHubMark />
                  Continue with GitHub
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {signup
                  ? "Already have an account?"
                  : "New to Skillora?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSignup(!signup);
                    setError("");
                  }}
                  className="font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {signup ? "Sign in" : "Create account"}
                </button>
              </p>
            </>
          )}

          <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3 text-primary" />
            {isAdmin
              ? "Role is verified after authentication."
              : "Your profile stays scoped to your account."}
          </p>
        </div>
      </section>
    </main>
  );
}