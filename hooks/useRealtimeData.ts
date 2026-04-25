"use client";

import useSWR, { mutate } from "swr";
import { useEffect } from "react";
import { listLogs, listStudents } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const studentsKey = "students";
export const logsKey = "logs";

export function useStudents() {
  return useSWR(studentsKey, listStudents, { refreshInterval: 0 });
}

export function useLogs(studentId?: string) {
  const key = studentId ? `${logsKey}-${studentId}` : logsKey;
  return useSWR(key, () => listLogs(studentId), { refreshInterval: 0 });
}

export function useRealtimeSubscriptions() {
  useEffect(() => {
    const channel = supabase
      .channel("chess-ladder-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        void mutate(studentsKey);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "logs" }, () => {
        void mutate(logsKey);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}
