"use client";

import { ReactNode } from "react";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeData";

export function AppClientShell({ children }: { children: ReactNode }) {
  useRealtimeSubscriptions();
  return <>{children}</>;
}
