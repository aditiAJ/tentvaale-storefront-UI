"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/inline-error";
import { ApiError } from "@/services/api-client";
import { requestPasswordReset, resetPassword } from "../api";

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-center">
      <h1 className="font-serif text-2xl text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

/** Asks for the email. The answer is the same whether or not an account exists, so this page never says which. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = email.trim();
    if (!clean) {
      setError("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(clean);
      setSent(true);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <Heading
          title="Check your email"
          text={`If an account exists for ${email.trim()}, we have sent a link to reset the password. It works once and expires in 1 hour.`}
        />
        <p className="text-xs text-muted-foreground">Nothing arrived? Look in spam, or wait a minute and try again.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/login">Back to log in</Link>} className="w-full" />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <Heading title="Forgot your password?" text="Enter your email and we will send you a link to choose a new one." />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        {error && <InlineError>{error}</InlineError>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="forgot-email" className="text-xs text-muted-foreground">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-card"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="mt-1 h-11 w-full">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Send reset link
        </Button>
        <Link href="/login" className="self-center text-xs text-muted-foreground transition-colors hover:text-primary">
          Back to log in
        </Link>
      </form>
    </div>
  );
}

/** Sets the new password from the link's token. On success the customer is sent to log in; no session starts here. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <Heading title="This link is not complete" text="Open the link from your email again, or ask for a new one." />
        <Button nativeButton={false} render={<Link href="/forgot-password">Ask for a new link</Link>} className="w-full" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-10 text-primary" aria-hidden />
        <Heading title="Password changed" text="You can now log in with your new password." />
        <Button nativeButton={false} render={<Link href="/login">Log in</Link>} className="w-full" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Choose a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token as string, password);
      setDone(true);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <Heading title="Choose a new password" text="Use at least 8 characters." />
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        {error && <InlineError>{error}</InlineError>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-password" className="text-xs text-muted-foreground">
            New password
          </Label>
          <div className="relative">
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-card pr-12"
              required
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-confirm" className="text-xs text-muted-foreground">
            Confirm new password
          </Label>
          <Input
            id="reset-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 bg-card"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="mt-1 h-11 w-full">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Change password
        </Button>
      </form>
    </div>
  );
}
