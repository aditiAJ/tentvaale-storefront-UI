"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { MockStoreProvider } from "@/mock-data/store";
import { SessionProvider } from "@/features/auth/session";
import { EASE, DUR } from "@/components/motion";
import { ApiError, NETWORK_ERROR_STATUS } from "@/services/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A refusal (401, 403, 404, 422) repeats itself; only transport and server faults are worth another try.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status !== NETWORK_ERROR_STATUS && error.status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      {/* reducedMotion="user" is the backstop: any motion component that
          forgets useReducedMotion still degrades to an opacity-only change
          when the OS asks for reduced motion. The transition here is the
          product default, overridden per-animation where it matters. */}
      <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE.out }}>
        <QueryClientProvider client={queryClient}>
          <MockStoreProvider>
            <SessionProvider>
              {children}
              <Toaster />
            </SessionProvider>
          </MockStoreProvider>
        </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
