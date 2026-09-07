"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { MockStoreProvider } from "@/mock-data/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MockStoreProvider>
        {children}
        <Toaster />
      </MockStoreProvider>
    </QueryClientProvider>
  );
}
