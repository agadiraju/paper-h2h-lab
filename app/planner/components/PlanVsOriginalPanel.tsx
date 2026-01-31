"use client";

import { useUserStore } from "@/lib/store/userStore";
import { useMemo } from "react";

export default function PlanVsOriginalPanel() {
  const { getActivePlan } = useUserStore();
  const activePlan = getActivePlan();

  const stats = useMemo(() => {
    if (!activePlan) {
      return {
        transfersIn: 0,
        transfersOut: 0,
        hits: 0,
        chips: [] as string[],
        squadSize: 0
      };
    }

    const transfersIn = activePlan.planEvents.filter(
      (e) => e.type === "TRANSFER_IN"
    ).length;
    const transfersOut = activePlan.planEvents.filter(
      (e) => e.type === "TRANSFER_OUT"
    ).length;
    const chips = activePlan.planEvents.filter((e) => e.type === "CHIP");

    // Simplified hit calculation (1 free transfer per GW)
    const gwCount = activePlan.endGW - activePlan.startGW + 1;
    const freeTransfers = gwCount;
    const hits = Math.max(0, transfersIn - freeTransfers) * 4;

    const uniqueChips = [...new Set(chips.map((c) => c.chip))];

    return {
      transfersIn,
      transfersOut,
      hits,
      chips: uniqueChips,
      squadSize: activePlan.squad.players.length
    };
  }, [activePlan]);

  if (!activePlan) return null;

  const transferEvents = activePlan.planEvents.filter(
    (e) => e.type === "TRANSFER_IN" || e.type === "TRANSFER_OUT"
  );

  return (
    <div className="p-3">
      <h2 className="text-xs font-bold mb-3 text-ink uppercase tracking-wide">
        Plan summary
      </h2>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-lighter">Squad size</span>
          <span className="text-ink font-medium">{stats.squadSize} players</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-lighter">Transfers in</span>
          <span className="text-ink font-medium">{stats.transfersIn}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-lighter">Transfers out</span>
          <span className="text-ink font-medium">{stats.transfersOut}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-lighter">Point hits</span>
          <span className={stats.hits > 0 ? "text-danger font-semibold" : "text-ink font-medium"}>
            {stats.hits > 0 ? `-${stats.hits}` : "0"}
          </span>
        </div>
        {stats.chips.length > 0 && (
          <div className="flex justify-between">
            <span className="text-ink-lighter">Chips used</span>
            <span className="text-warning font-semibold">{stats.chips.join(", ")}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t-2 border-border">
        <h3 className="text-xs font-semibold text-ink mb-2">
          Planned transfers
        </h3>
        {transferEvents.length === 0 ? (
          <p className="text-[11px] text-ink-lighter italic">
            No transfers planned yet.
          </p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {transferEvents.map((event, idx) => {
              const playerName =
                event.type === "TRANSFER_IN" && event.playerData
                  ? event.playerData.name
                  : event.playerId;

              return (
                <div
                  key={idx}
                  className="text-[11px] flex items-center gap-2"
                >
                  <span className="text-ink-lighter">GW{event.gameweek}</span>
                  <span
                    className={
                      event.type === "TRANSFER_IN"
                        ? "text-primary font-semibold"
                        : "text-danger font-semibold"
                    }
                  >
                    {event.type === "TRANSFER_IN" ? "→ IN" : "← OUT"}
                  </span>
                  <span className="text-ink truncate">{playerName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
