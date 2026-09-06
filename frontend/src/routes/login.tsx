import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, BrainCircuit, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to dashboard
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* =========================================================
          LEFT — REVIVE AI BRAND / VALUE PROPOSITION
      ========================================================== */}
      <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-[32rem] w-[32rem] rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="absolute inset-0 opacity-[0.035]">
            <svg
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="revive-grid"
                  width="48"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 48 0 L 0 0 0 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#revive-grid)" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 xl:px-16 xl:py-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950 shadow-lg">
                R
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight text-white">
                  REVIVE AI
                </p>
                <p className="text-xs text-slate-400">
                  Revenue Recovery Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Main message */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Intelligent revenue recovery
            </div>

            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Recover the revenue
              <span className="block text-slate-400">
                you thought was lost.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 xl:text-lg">
              REVIVE AI detects revenue leakage, evaluates recovery strategies,
              and helps businesses recover lost revenue with explainable,
              guarded decisions.
            </p>

            {/* Feature cards */}
            <div className="mt-10 space-y-3">
              <Feature
                icon={<BrainCircuit className="size-4" />}
                title="AI-powered decisions"
                description="Evaluate the best recovery strategy for every opportunity."
              />

              <Feature
                icon={<ShieldCheck className="size-4" />}
                title="Financial guardrails"
                description="Keep recovery actions within defined business limits."
              />

              <Feature
                icon={<TrendingUp className="size-4" />}
                title="Measured outcomes"
                description="Track recovery performance from opportunity to outcome."
              />
            </div>
          </div>

          {/* Bottom trust line */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <p className="text-xs text-slate-500">
              Revenue Recovery Intelligence Platform
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="size-3.5" />
              Secure merchant access
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          RIGHT — LOGIN FORM
      ========================================================== */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-10 text-center lg:hidden">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              R
            </div>

            <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
              REVIVE AI
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Revenue Recovery Intelligence
            </p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-500">
              Merchant Console
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to continue managing your revenue recovery.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
            >
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Create account */}
          <div className="mt-8 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have a merchant account?{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/register" })}
                className="font-semibold text-slate-950 underline-offset-4 transition-colors hover:text-slate-600 hover:underline"
              >
                Create account
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-3.5" />
            Secure merchant access
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   FEATURE ITEM
========================================================= */

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-200">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}