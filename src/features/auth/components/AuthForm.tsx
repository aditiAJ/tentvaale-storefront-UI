"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import type { AccountType } from "@/mock-data/types";

// Flowstep screens 3 (desktop) / 4 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// Only the Sign Up tab state was generated — the Log In tab below mirrors its
// field set (no account-type toggle, adds "Forgot password?").
export function AuthForm({ initialTab }: { initialTab: "signup" | "login" }) {
  const router = useRouter();
  const { signup, login } = useMockStore();
  const [tab, setTab] = useState<"signup" | "login">(initialTab);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("Customer");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) return;
    setSubmitting(true);
    try {
      if (tab === "signup") {
        signup({ name: emailOrPhone.split("@")[0] || emailOrPhone, email: emailOrPhone, phone: "", accountType });
        toast.success("Account created — your Plan Board is ready.");
      } else {
        login(emailOrPhone);
      }
      router.push("/plans");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 md:gap-8">
      <div className="flex w-full items-center justify-between md:hidden">
        <button className="-ml-1 flex size-8 items-center justify-center" onClick={() => router.back()} aria-label="Back">
          <ChevronLeft className="size-6 text-foreground" />
        </button>
        <span className="font-serif text-2xl tracking-wide text-primary">Tentvaale</span>
        <div className="size-8" />
      </div>

      <span className="hidden font-serif text-2xl tracking-wide text-primary md:block">Tentvaale</span>

      <div className="flex w-full flex-col gap-2 text-center">
        <h1 className="font-serif text-3xl text-foreground">{tab === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm text-muted-foreground">
          {tab === "signup" ? "Save your favourites and start planning in minutes" : "Log in to pick up your Plan Board"}
        </p>
      </div>

      <div className="flex w-full border-b border-border">
        <button
          className={cn("flex-1 pb-3 text-sm font-medium transition-colors", tab === "signup" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
          onClick={() => setTab("signup")}
        >
          Sign Up
        </button>
        <button
          className={cn("flex-1 pb-3 text-sm font-medium transition-colors", tab === "login" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
          onClick={() => setTab("login")}
        >
          Log In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Email or phone</label>
          <input
            type="text"
            placeholder="Enter your email or phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-11 text-sm text-foreground outline-none focus:border-primary"
            />
            <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {tab === "signup" && (
          <div className="flex flex-col gap-2">
            <div className="flex w-full gap-1 rounded-lg border border-border bg-card p-1">
              {(["Customer", "EventPlanner"] as AccountType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                    accountType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {t === "Customer" ? "Customer" : "Event Planner"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              We ask so we can tailor pricing and tools — planners get bulk rates and multi-event tools
            </p>
          </div>
        )}

        {tab === "login" && (
          <button type="button" className="self-end text-xs text-muted-foreground hover:text-primary" onClick={() => toast.info("Password reset isn't wired up yet.")}>
            Forgot password?
          </button>
        )}

        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {tab === "signup" ? "Create Account" : "Log In"}
        </button>
      </form>

      <div className="flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex w-full flex-col gap-4 md:flex-row">
        <button
          type="button"
          onClick={() => toast.info("Google sign-in isn't wired up yet.")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium text-foreground"
        >
          <span className="text-base font-semibold leading-none">G</span> Google
        </button>
        <button
          type="button"
          onClick={() => toast.info("Facebook sign-in isn't wired up yet.")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium text-foreground"
        >
          <span className="text-base font-semibold leading-none">f</span> Facebook
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {tab === "signup" ? "Already have an account? " : "Don't have an account? "}
        <button type="button" className="font-medium text-primary" onClick={() => setTab(tab === "signup" ? "login" : "signup")}>
          {tab === "signup" ? "Log In" : "Sign Up"}
        </button>
      </p>

      <Link href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground">
        ← Back to browsing
      </Link>
    </div>
  );
}
