"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { MockStoreProvider } from "@/mock-data/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MockStoreProvider>
          {children}
          <Toaster />
        </MockStoreProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
