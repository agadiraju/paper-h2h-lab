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
          <h2 className="text-xs font-semibold mb-2 text-slate-200 uppercase tracking-wide">
            Opponent Schedule
          </h2>
          <div className="space-y-1 text-xs border border-slate-800 rounded p-2">
            {Array.from(
              { length: activePlan.endGW - activePlan.startGW + 1 },
              (_, i) => activePlan.startGW + i
            ).map((gw) => (
              <div key={gw} className="flex items-center justify-between">
                <span className="text-slate-500">GW{gw}</span>
                <span className="text-slate-300 truncate ml-2">
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
          <h2 className="text-xs font-semibold mb-2 text-slate-200 uppercase tracking-wide">
            Actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            >
              Reset transfers & chips
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Click a gameweek to view your squad, compare with your opponent, and plan transfers.
          </p>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs shadow-lg">
            <div className="text-sm font-semibold text-slate-100 mb-2">
              Reset plan?
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              This will clear all planned transfers, chips, and captains for this plan. Your squad will remain.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded bg-slate-800 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPlan}
                className="rounded bg-red-600 px-3 py-1 text-[11px] text-slate-50 hover:bg-red-500"
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
