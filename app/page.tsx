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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-slate-100 mb-4">
          Paper H2H Lab
        </h1>
        <p className="text-slate-400 mb-8">
          Plan your FPL transfers with your H2H opponents in mind. Track
          differentials, doubles, blanks, and captain choices across multiple
          gameweeks.
        </p>

        <div className="space-y-3">
          <Link
            href="/setup"
            className="block w-full rounded bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-500"
          >
            Get Started
          </Link>

          {setupComplete && plans.length > 0 && (
            <Link
              href="/planner"
              className="block w-full rounded bg-slate-800 px-6 py-3 text-sm text-slate-300 hover:bg-slate-700"
            >
              Go to Planner
            </Link>
          )}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">H2H</div>
            <div className="text-xs text-slate-500">Focused</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">7 GW</div>
            <div className="text-xs text-slate-500">Max span</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">5</div>
            <div className="text-xs text-slate-500">Plans</div>
          </div>
        </div>
      </div>
    </div>
  );
}
