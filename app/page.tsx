"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { setupComplete, plans } = useUserStore();

  // Auto-redirect if already set up
  useEffect(() => {
    if (setupComplete && plans.length > 0) {
      router.push("/planner");
    }
  }, [setupComplete, plans, router]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-paper">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-ink mb-4 tracking-tight">
          Paper H2H Lab
        </h1>
        <p className="text-ink-lighter mb-8 leading-relaxed">
          Plan your FPL transfers with your H2H opponents in mind. Track
          differentials, doubles, blanks, and captain choices across multiple
          gameweeks.
        </p>

        <div className="space-y-3">
          <Link
            href="/setup"
            className="block w-full rounded border-2 border-primary bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark hover:border-primary-dark transition-colors shadow-md"
          >
            Get Started
          </Link>

          {setupComplete && plans.length > 0 && (
            <Link
              href="/planner"
              className="block w-full rounded border-2 border-border bg-paper-dark px-6 py-3 text-sm text-ink-light hover:bg-paper-darker transition-colors"
            >
              Go to Planner
            </Link>
          )}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="border-2 border-border rounded bg-paper-dark p-3">
            <div className="text-2xl font-bold text-primary">H2H</div>
            <div className="text-xs text-ink-lighter">Focused</div>
          </div>
          <div className="border-2 border-border rounded bg-paper-dark p-3">
            <div className="text-2xl font-bold text-primary">7 GW</div>
            <div className="text-xs text-ink-lighter">Max span</div>
          </div>
          <div className="border-2 border-border rounded bg-paper-dark p-3">
            <div className="text-2xl font-bold text-primary">5</div>
            <div className="text-xs text-ink-lighter">Plans</div>
          </div>
        </div>
      </div>
    </div>
  );
}
