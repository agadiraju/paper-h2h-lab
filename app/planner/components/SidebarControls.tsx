"use client";

import { useUserStore } from "@/lib/store/userStore";
import { useState } from "react";

export default function SidebarControls() {
  const { getActivePlan, updatePlan } = useUserStore();
  const activePlan = getActivePlan();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!activePlan) return null;

  const handleResetPlan = () => {
    updatePlan(activePlan.id, {
      planEvents: [],
      captains: {},
      opponentSquads: {}
    });
    setShowResetConfirm(false);
  };

  return (
    <>
      <div className="p-3 space-y-5">
        {/* Opponents schedule */}
        <div>
          <h2 className="text-xs font-bold mb-2 text-ink uppercase tracking-wide">
            Opponent Schedule
          </h2>
          <div className="space-y-1 text-xs border-2 border-border rounded bg-paper p-2">
            {Array.from(
              { length: activePlan.endGW - activePlan.startGW + 1 },
              (_, i) => activePlan.startGW + i
            ).map((gw) => (
              <div key={gw} className="flex items-center justify-between">
                <span className="text-ink-lighter">GW{gw}</span>
                <span className="text-ink font-medium truncate ml-2">
                  {activePlan.opponents[gw]
                    ? activePlan.opponents[gw].teamName
                    : "TBD"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-bold mb-2 text-ink uppercase tracking-wide">
            Actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full rounded bg-paper border-2 border-border px-2 py-1.5 text-[11px] text-ink-light hover:bg-paper-dark hover:text-ink transition-colors"
            >
              Reset transfers & chips
            </button>
          </div>
          <p className="text-[10px] text-ink-lighter mt-3 leading-relaxed">
            Click a gameweek to view your squad, compare with your opponent, and plan transfers.
          </p>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border-2 border-border bg-paper p-4 text-xs shadow-lg">
            <div className="text-sm font-semibold text-ink mb-2">
              Reset plan?
            </div>
            <p className="text-[11px] text-ink-lighter mb-3 leading-relaxed">
              This will clear all planned transfers, chips, and captains for this plan. Your squad will remain.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded border-2 border-border bg-paper-dark px-3 py-1 text-[11px] text-ink hover:bg-paper-darker transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPlan}
                className="rounded border-2 border-danger bg-danger px-3 py-1 text-[11px] text-white hover:bg-danger/90 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
