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
    GK: "bg-amber-900/40 border-amber-700",
    DEF: "bg-blue-900/40 border-blue-700",
    MID: "bg-green-900/40 border-green-700",
    FWD: "bg-red-900/40 border-red-700"
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
        className={`group relative rounded border px-2 py-1.5 cursor-pointer transition-colors hover:bg-slate-800/50 ${
          positionColors[player.position] ?? "bg-slate-800 border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-slate-100 truncate">
                {player.name}
              </span>
              {isCaptain && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-600 text-yellow-100 font-bold">
                  C
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{player.team}</span>
            </div>
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
          <button
            onClick={handleToggleCaptain}
            className={`text-[9px] px-1 py-0.5 rounded ${
              isCaptain
                ? "bg-yellow-600 text-yellow-100"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            title={isCaptain ? "Remove captain" : "Make captain"}
          >
            C
          </button>
          <button
            onClick={handleToggleRole}
            className="text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
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
