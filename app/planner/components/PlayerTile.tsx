"use client";

import { Player } from "@/lib/models";
import { useUserStore } from "@/lib/store/userStore";
import { useState } from "react";
import TransferDialog from "./TransferDialog";

interface PlayerTileProps {
  player: Player;
  gameweek: number;
  role: "XI" | "BENCH";
}

export default function PlayerTile({ player, gameweek, role }: PlayerTileProps) {
  const { getActivePlan, updatePlan } = useUserStore();
  const activePlan = getActivePlan();

  const [showTransferDialog, setShowTransferDialog] = useState(false);

  if (!activePlan) return null;

  const captainId = activePlan.captains[gameweek];
  const isCaptain = captainId === player.id;

  const positionColors: Record<string, string> = {
    GK: "bg-[#C4956C]/10 border-[#C4956C]/40",
    DEF: "bg-[#6B8FA8]/10 border-[#6B8FA8]/40",
    MID: "bg-[#7A9B6E]/10 border-[#7A9B6E]/40",
    FWD: "bg-[#B67162]/10 border-[#B67162]/40"
  };

  const handleToggleCaptain = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePlan(activePlan.id, {
      captains: {
        ...activePlan.captains,
        [gameweek]: isCaptain ? undefined : player.id
      }
    });
  };

  const handleToggleRole = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slots = activePlan.squad.perGameweekSlots[gameweek] ?? [];
    const updatedSlots = slots.map((slot) =>
      slot.playerId === player.id
        ? { ...slot, role: role === "XI" ? "BENCH" as const : "XI" as const }
        : slot
    );
    updatePlan(activePlan.id, {
      squad: {
        ...activePlan.squad,
        perGameweekSlots: {
          ...activePlan.squad.perGameweekSlots,
          [gameweek]: updatedSlots
        }
      }
    });
  };

  return (
    <>
      <div
        onClick={() => setShowTransferDialog(true)}
        className={`group relative rounded border-2 px-2 py-1.5 cursor-pointer transition-colors hover:bg-paper/50 ${
          positionColors[player.position] ?? "bg-paper border-border"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-ink truncate">
                {player.name}
              </span>
              {isCaptain && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-warning border border-warning/40 text-white font-bold">
                  C
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-ink-lighter">
              <span>{player.team}</span>
            </div>
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
          <button
            onClick={handleToggleCaptain}
            className={`text-[9px] px-1 py-0.5 rounded border ${
              isCaptain
                ? "bg-warning border-warning text-white"
                : "bg-paper-dark border-border text-ink-light hover:bg-paper-darker"
            }`}
            title={isCaptain ? "Remove captain" : "Make captain"}
          >
            C
          </button>
          <button
            onClick={handleToggleRole}
            className="text-[9px] px-1 py-0.5 rounded border bg-paper-dark border-border text-ink-light hover:bg-paper-darker"
            title={role === "XI" ? "Move to bench" : "Move to XI"}
          >
            {role === "XI" ? "↓" : "↑"}
          </button>
        </div>
      </div>

      {showTransferDialog && (
        <TransferDialog
          player={player}
          gameweek={gameweek}
          onClose={() => setShowTransferDialog(false)}
        />
      )}
    </>
  );
}
