"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";
import PlannerShell from "./components/PlannerShell";

export default function PlannerPage() {
  const router = useRouter();
  const { setupComplete, plans, activePlanId } = useUserStore();

  useEffect(() => {
    // Redirect to setup if not configured or no plans
    if (!setupComplete || plans.length === 0) {
      router.push("/setup");
    }
  }, [setupComplete, plans, router]);

  // Show nothing while redirecting
  if (!setupComplete || plans.length === 0) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  // No active plan selected
  if (!activePlanId) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-4">
            No plan selected.
          </div>
          <button
            onClick={() => router.push("/setup")}
            className="text-sm text-green-400 hover:text-green-300"
          >
            Create a new plan
          </button>
        </div>
      </div>
    );
  }

  return <PlannerShell />;
}
