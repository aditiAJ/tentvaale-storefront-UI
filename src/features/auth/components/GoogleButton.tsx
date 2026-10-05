"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ApiError } from "@/services/api-client";

/** The Google OAuth client id (public by design). Empty: the button is not shown and email sign-in is the only way. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface GoogleIdApi {
  initialize(config: { client_id: string; callback: (response: { credential?: string }) => void }): void;
  renderButton(element: HTMLElement, options: Record<string, string | number>): void;
}

/** Google's script puts itself on window; typed here for the one call we use (the venue picker types its own part). */
const googleId = () => (window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } }).google?.accounts?.id;

let script: Promise<GoogleIdApi> | null = null;

function loadGoogle(): Promise<GoogleIdApi> {
  const ready = googleId();
  if (ready) return Promise.resolve(ready);
  script ??= new Promise<GoogleIdApi>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://accounts.google.com/gsi/client";
    tag.async = true;
    tag.onload = () => {
      const api = googleId();
      if (api) resolve(api);
      else reject(new Error("Google did not load"));
    };
    tag.onerror = () => reject(new Error("Google could not be loaded"));
    document.head.appendChild(tag);
  });
  return script;
}

/**
 * "Continue with Google". Google's own button draws itself; the ID token it hands back goes to our
 * backend, which verifies it and starts the usual session. Nothing Google-related is trusted here.
 */
export function GoogleButton({ onToken }: { onToken: (idToken: string) => Promise<void> }) {
  const holder = useRef<HTMLDivElement>(null);
  const handler = useRef(onToken);
  useEffect(() => {
    handler.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    void loadGoogle()
      .then((google) => {
        if (cancelled || !holder.current) return;
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => {
            if (!credential) return;
            handler.current(credential).catch((error) =>
              toast.error(error instanceof ApiError ? error.message : "We couldn't sign you in with Google. Please try again."),
            );
          },
        });
        google.renderButton(holder.current, { theme: "outline", size: "large", text: "continue_with", width: 320 });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={holder} className="flex min-h-11 w-full justify-center" />;
}
