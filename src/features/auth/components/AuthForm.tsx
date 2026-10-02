"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DUR, EASE, SPRING } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/api-client";
import { useSession } from "../session";

/** The two kinds of account the form offers; the backend spells them CUSTOMER and EVENT_PLANNER. */
type AccountType = "Customer" | "EventPlanner";

/** Only ever follow a path on this site, never an address someone put in the link. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/plans";
}

// Flowstep screens 3 (desktop) / 4 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// Only the Sign Up tab state was generated — the Log In tab below mirrors its
// field set (no account-type toggle, adds "Forgot password?").
export function AuthForm({ initialTab }: { initialTab: "signup" | "login" }) {
  const router = useRouter();
  const { signup, login } = useSession();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<"signup" | "login">(initialTab);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("Customer");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (tab === "signup") {
      if (!fullName.trim()) {
        setError("Please tell us your name.");
        return;
      }
      if (password.length < 8) {
        setError("Choose a password of at least 8 characters.");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (tab === "signup") {
        await signup({
          fullName: fullName.trim(),
          email: cleanEmail,
          password,
          phone: phone.trim() || undefined,
          accountType: accountType === "EventPlanner" ? "EVENT_PLANNER" : "CUSTOMER",
        });
        toast.success("Account created — your Plan Event is ready.");
      } else {
        await login({ email: cleanEmail, password });
      }
      router.push(safeNext(searchParams.get("next")));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 md:gap-7">
      <div className="flex w-full items-center justify-between md:hidden">
        <button
          className="press -ml-1 flex size-10 items-center justify-center rounded-sm transition-colors hover:bg-secondary"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronLeft className="size-6 text-foreground" />
        </button>
        <span className="font-serif text-2xl tracking-wide text-primary">Tentvaale</span>
        <div className="size-10" />
      </div>

      <span className="hidden font-serif text-2xl tracking-wide text-primary md:block">Tentvaale</span>

      {/* Heading re-keys on the tab so the copy cross-fades with the form. */}
      <div className="flex w-full flex-col gap-2 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ duration: reduce ? 0.01 : DUR.fast, ease: EASE.out }}
            className="flex flex-col gap-2"
          >
            <h1 className="font-serif text-3xl text-foreground">{tab === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="text-sm text-muted-foreground">
              {tab === "signup" ? "Save your favourites and start planning in minutes" : "Log in to pick up your Plan Event"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* One underline slides between the two tabs (layoutId) rather than two
          borders toggling — the movement carries which way you went. */}
      <div className="flex w-full border-b border-border" role="tablist">
        {(["signup", "login"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={cn(
              "relative flex-1 pb-3 text-sm font-medium transition-colors duration-200 ease-out-quint",
              tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab(t)}
          >
            {t === "signup" ? "Sign Up" : "Log In"}
            {tab === t && (
              <motion.span
                layoutId="auth-tab-underline"
                transition={SPRING.snappy}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {tab === "signup" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-name" className="text-xs text-muted-foreground">
              Full name
            </Label>
            <Input
              id="auth-name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 bg-card"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-email" className="text-xs text-muted-foreground">
            Email
          </Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-card"
          />
        </div>
        {tab === "signup" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-phone" className="text-xs text-muted-foreground">
              Phone (optional)
            </Label>
            <Input
              id="auth-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 bg-card"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-password" className="text-xs text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-card pr-12"
            />
            <button
              type="button"
              className="press absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* The account-type block collapses in and out with the tab rather than
            the form height jumping between Sign Up and Log In. */}
        <AnimatePresence initial={false}>
          {tab === "signup" && (
            <motion.div
              key="account-type"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: reduce ? 0.01 : DUR.base, ease: EASE.inOut },
                opacity: { duration: reduce ? 0.01 : DUR.fast, ease: EASE.out },
              }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-0.5">
                <div className="relative flex w-full gap-1 rounded-xl border border-border bg-card p-1">
                  {(["Customer", "EventPlanner"] as AccountType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAccountType(t)}
                      aria-pressed={accountType === t}
                      className={cn(
                        "relative z-10 flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ease-out-quint",
                        accountType === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {accountType === t && (
                        <motion.span
                          layoutId="account-type-pill"
                          transition={SPRING.snappy}
                          className="absolute inset-0 -z-10 rounded-lg bg-primary"
                        />
                      )}
                      {t === "Customer" ? "Customer" : "Event Planner"}
                    </button>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                  We ask so we can tailor pricing and tools — planners get bulk rates and multi-event tools
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === "login" && (
          <button
            type="button"
            className="self-end text-xs text-muted-foreground transition-colors hover:text-primary"
            onClick={() => toast.info("Password reset isn't wired up yet.")}
          >
            Forgot password?
          </button>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="mt-1 h-12 w-full">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {tab === "signup" ? "Create Account" : "Log In"}
        </Button>
      </form>

      <div className="flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex w-full flex-col gap-3 md:flex-row">
        {[
          { label: "Google", glyph: "G" },
          { label: "Facebook", glyph: "f" },
        ].map((provider) => (
          <Button
            key={provider.label}
            type="button"
            variant="outline"
            size="lg"
            className="h-12 flex-1"
            onClick={() => toast.info(`${provider.label} sign-in isn't wired up yet.`)}
          >
            <span className="text-base leading-none font-semibold">{provider.glyph}</span> {provider.label}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {tab === "signup" ? "Already have an account? " : "Don't have an account? "}
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setTab(tab === "signup" ? "login" : "signup")}
        >
          {tab === "signup" ? "Log In" : "Sign Up"}
        </button>
      </p>

      <Link href="/" className="text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground">
        ← Back to browsing
      </Link>
    </div>
  );
}
