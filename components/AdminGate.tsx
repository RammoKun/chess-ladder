"use client";

import { ReactNode, useState } from "react";

const STORAGE_KEY = "chess-ladder-admin-unlocked";
const FALLBACK_PIN = "8652811110";

export function AdminGate({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [pin, setPin] = useState("");

  if (allowed) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#111111] p-5">
        <h1 className="text-lg font-semibold text-[#FFD700]">Admin Access</h1>
        <p className="mt-1 text-sm text-zinc-400">Enter coach PIN for V1 access.</p>
        <input
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="Enter PIN"
          className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            const validPin = process.env.NEXT_PUBLIC_ADMIN_PIN || FALLBACK_PIN;
            if (pin === validPin) {
              localStorage.setItem(STORAGE_KEY, "true");
              setAllowed(true);
            }
          }}
          className="mt-3 w-full rounded-xl bg-[#FFD700] p-3 text-sm font-semibold text-zinc-900"
        >
          Unlock
        </button>
      </section>
    </main>
  );
}
