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
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-paper">
        <div className="text-sm text-ink-lighter">No active plan</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-paper">
      {/* Plan header */}
      <div className="border-b-2 border-border bg-paper-dark px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlanSwitcher />
          <div className="text-xs text-ink-lighter">
            {activePlan.leagueName} · GW{activePlan.startGW}–{activePlan.endGW}
          </div>
        </div>
        <div className="text-xs text-ink-lighter">
          {activePlan.squad.players.length} players
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r-2 border-border bg-paper-darker overflow-y-auto">
          <SidebarControls />
        </aside>

        <section className="flex-1 flex flex-col overflow-hidden bg-paper">
          <GameweekTimeline />
        </section>

        <aside className="w-80 border-l-2 border-border bg-paper-darker overflow-y-auto">
          <div className="border-b-2 border-border">
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
