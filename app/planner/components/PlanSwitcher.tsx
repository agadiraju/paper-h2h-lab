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
        className="flex items-center gap-2 rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
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
          <div className="absolute top-full left-0 mt-1 w-64 rounded-lg border border-slate-800 bg-slate-950 shadow-xl z-40">
            <div className="p-2 border-b border-slate-800">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1">
                Your plans ({plans.length}/{MAX_PLANS})
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-1">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`group flex items-center justify-between rounded px-2 py-2 cursor-pointer ${
                    plan.id === activePlanId
                      ? "bg-green-900/30 text-green-400"
                      : "hover:bg-slate-800 text-slate-300"
                  }`}
                  onClick={() => handleSwitchPlan(plan.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{plan.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {plan.leagueName} · GW{plan.startGW}–{plan.endGW}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(plan.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400"
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
              <div className="p-2 border-t border-slate-800">
                <button
                  onClick={handleNewPlan}
                  className="w-full flex items-center justify-center gap-2 rounded bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
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
          <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl">
            <div className="text-sm font-semibold text-slate-100 mb-2">
              Delete plan?
            </div>
            <p className="text-xs text-slate-400 mb-4">
              This will permanently delete "{plans.find((p) => p.id === showDeleteConfirm)?.name}" and all its data.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlan(showDeleteConfirm)}
                className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500"
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
