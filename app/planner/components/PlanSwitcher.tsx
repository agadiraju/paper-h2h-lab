"use client";

import { useUserStore } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_PLANS } from "@/lib/models";

export default function PlanSwitcher() {
  const router = useRouter();
  const { plans, activePlanId, setActivePlan, deletePlan } = useUserStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const activePlan = plans.find((p) => p.id === activePlanId);

  const handleSwitchPlan = (planId: string) => {
    setActivePlan(planId);
    setShowDropdown(false);
  };

  const handleDeletePlan = (planId: string) => {
    deletePlan(planId);
    setShowDeleteConfirm(null);
    
    // If no plans left, redirect to setup
    if (plans.length <= 1) {
      router.push("/setup");
    }
  };

  const handleNewPlan = () => {
    setShowDropdown(false);
    router.push("/setup");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded border-2 border-border bg-paper-dark px-3 py-1.5 text-sm font-semibold text-ink hover:bg-paper-darker transition-colors"
      >
        <span className="max-w-[160px] truncate">{activePlan?.name ?? "Select Plan"}</span>
        <svg
          className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 rounded-lg border-2 border-border bg-paper shadow-xl z-40">
            <div className="p-2 border-b-2 border-border">
              <div className="text-[10px] uppercase tracking-wide text-ink-lighter font-semibold px-2 py-1">
                Your plans ({plans.length}/{MAX_PLANS})
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-1">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`group flex items-center justify-between rounded px-2 py-2 cursor-pointer ${
                    plan.id === activePlanId
                      ? "bg-primary/10 text-primary border-2 border-primary/30"
                      : "hover:bg-paper-dark text-ink"
                  }`}
                  onClick={() => handleSwitchPlan(plan.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{plan.name}</div>
                    <div className="text-[10px] text-ink-lighter">
                      {plan.leagueName} · GW{plan.startGW}–{plan.endGW}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(plan.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-paper-darker text-ink-lighter hover:text-danger"
                    title="Delete plan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {plans.length < MAX_PLANS && (
              <div className="p-2 border-t-2 border-border">
                <button
                  onClick={handleNewPlan}
                  className="w-full flex items-center justify-center gap-2 rounded border-2 border-border bg-paper-dark px-3 py-2 text-xs text-ink font-medium hover:bg-paper-darker transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Plan
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border-2 border-border bg-paper p-4 shadow-xl">
            <div className="text-sm font-semibold text-ink mb-2">
              Delete plan?
            </div>
            <p className="text-xs text-ink-lighter mb-4 leading-relaxed">
              This will permanently delete "{plans.find((p) => p.id === showDeleteConfirm)?.name}" and all its data.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded border-2 border-border bg-paper-dark px-3 py-1.5 text-xs text-ink hover:bg-paper-darker transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlan(showDeleteConfirm)}
                className="rounded border-2 border-danger bg-danger px-3 py-1.5 text-xs text-white hover:bg-danger/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
