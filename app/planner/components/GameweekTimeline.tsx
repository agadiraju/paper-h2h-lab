"use client";

import { useUserStore } from "@/lib/store/userStore";
import GameweekColumn from "./GameweekColumn";
import { useMemo } from "react";

export default function GameweekTimeline() {
  const { getActivePlan } = useUserStore();
  const activePlan = getActivePlan();

  const visibleGWs = useMemo(() => {
    if (!activePlan) return [];
    const gws: number[] = [];
    for (let gw = activePlan.startGW; gw <= activePlan.endGW; gw++) {
      gws.push(gw);
    }
    return gws;
  }, [activePlan]);

  if (!activePlan) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-800 px-4 py-2 text-xs text-slate-400 flex justify-between items-center">
        <span>Gameweek timeline</span>
        <span className="text-[11px]">
          {visibleGWs.length} gameweeks
        </span>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 px-3 py-3 min-w-max">
          {visibleGWs.map((gw) => (
            <GameweekColumn
              key={gw}
              gameweek={gw}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
