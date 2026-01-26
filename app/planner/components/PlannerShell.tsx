"use client";

import { useUserStore } from "@/lib/store/userStore";
import SidebarControls from "./SidebarControls";
import GameweekTimeline from "./GameweekTimeline";
import PlanVsOriginalPanel from "./PlanVsOriginalPanel";
import H2HPanel from "./H2HPanel";
import PlanSwitcher from "./PlanSwitcher";

export default function PlannerShell() {
  const { getActivePlan } = useUserStore();
  const activePlan = getActivePlan();

  if (!activePlan) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-sm text-slate-400">No active plan</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Plan header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlanSwitcher />
          <div className="text-xs text-slate-500">
            {activePlan.leagueName} · GW{activePlan.startGW}–{activePlan.endGW}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {activePlan.squad.players.length} players
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-950/80 overflow-y-auto">
          <SidebarControls />
        </aside>

        <section className="flex-1 flex flex-col overflow-hidden">
          <GameweekTimeline />
        </section>

        <aside className="w-80 border-l border-slate-800 bg-slate-950/80 overflow-y-auto">
          <div className="border-b border-slate-800">
            <PlanVsOriginalPanel />
          </div>
          <div>
            <H2HPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
