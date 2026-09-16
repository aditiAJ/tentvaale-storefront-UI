"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { MockStoreProvider } from "@/mock-data/store";
import { EASE, DUR } from "@/components/motion";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      {/* reducedMotion="user" is the backstop: any motion component that
          forgets useReducedMotion still degrades to an opacity-only change
          when the OS asks for reduced motion. The transition here is the
          product default, overridden per-animation where it matters. */}
      <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE.out }}>
        <QueryClientProvider client={queryClient}>
          <MockStoreProvider>
            {children}
            <Toaster />
          </MockStoreProvider>
        </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
