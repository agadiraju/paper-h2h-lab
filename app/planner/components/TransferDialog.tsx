"use client";

import { Player, ChipType, PlanEvent } from "@/lib/models";
import { useUserStore } from "@/lib/store/userStore";
import { useState } from "react";

interface TransferDialogProps {
  player: Player;
  gameweek: number;
  onClose: () => void;
}

const CHIPS: ChipType[] = ["WC", "FH", "BB", "TC"];

export default function TransferDialog({
  player,
  gameweek,
  onClose
}: TransferDialogProps) {
  const { getActivePlan, updatePlan } = useUserStore();
  const activePlan = getActivePlan();

  const [replacementName, setReplacementName] = useState("");
  const [replacementTeam, setReplacementTeam] = useState("");
  const [replacementPosition, setReplacementPosition] = useState<
    "GK" | "DEF" | "MID" | "FWD"
  >(player.position);

  if (!activePlan) return null;

  const activeChips = activePlan.planEvents.filter(
    (ev): ev is { type: "CHIP"; gameweek: number; chip: ChipType } =>
      ev.type === "CHIP" && ev.gameweek === gameweek
  );

  const handleTransferOut = () => {
    const newEvents: PlanEvent[] = [
      ...activePlan.planEvents,
      {
        type: "TRANSFER_OUT",
        gameweek,
        playerId: player.id
      }
    ];

    if (replacementName && replacementTeam) {
      const newPlayerId = `transfer-${Date.now()}`;
      newEvents.push({
        type: "TRANSFER_IN",
        gameweek,
        playerId: newPlayerId,
        playerData: {
          id: newPlayerId,
          name: replacementName,
          team: replacementTeam.toUpperCase(),
          position: replacementPosition
        }
      });

      // Add new player to squad and slots
      const newPlayer: Player = {
        id: newPlayerId,
        name: replacementName,
        team: replacementTeam.toUpperCase(),
        position: replacementPosition
      };

      const updatedPlayers = activePlan.squad.players.filter(
        (p) => p.id !== player.id
      );
      updatedPlayers.push(newPlayer);

      const perGameweekSlots = { ...activePlan.squad.perGameweekSlots };
      
      // Update slots from this GW onwards
      for (let gw = gameweek; gw <= activePlan.endGW; gw++) {
        const slots = perGameweekSlots[gw] ?? [];
        // Replace old player with new player in same role
        const oldSlot = slots.find((s) => s.playerId === player.id);
        const role = oldSlot?.role ?? "BENCH";
        
        perGameweekSlots[gw] = [
          ...slots.filter((s) => s.playerId !== player.id),
          { playerId: newPlayerId, role }
        ];
      }

      updatePlan(activePlan.id, {
        planEvents: newEvents,
        squad: {
          players: updatedPlayers,
          perGameweekSlots
        }
      });
    } else {
      // Just remove player from this GW onwards
      const perGameweekSlots = { ...activePlan.squad.perGameweekSlots };
      for (let gw = gameweek; gw <= activePlan.endGW; gw++) {
        perGameweekSlots[gw] = (perGameweekSlots[gw] ?? []).filter(
          (s) => s.playerId !== player.id
        );
      }

      updatePlan(activePlan.id, {
        planEvents: newEvents,
        squad: {
          ...activePlan.squad,
          perGameweekSlots
        }
      });
    }

    onClose();
  };

  const handleToggleChip = (chip: ChipType) => {
    const isActive = activeChips.some((c) => c.chip === chip);
    let newEvents: PlanEvent[];

    if (isActive) {
      newEvents = activePlan.planEvents.filter(
        (ev) => !(ev.type === "CHIP" && ev.gameweek === gameweek && ev.chip === chip)
      );
    } else {
      newEvents = [
        ...activePlan.planEvents,
        { type: "CHIP", gameweek, chip }
      ];
    }

    updatePlan(activePlan.id, { planEvents: newEvents });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-100">
            {player.name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ×
          </button>
        </div>

        <div className="text-xs text-slate-400 mb-4">
          {player.team} · {player.position} · GW{gameweek}
        </div>

        {/* Transfer section */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-300 mb-2">
            Plan transfer out
          </div>
          <div className="space-y-2">
            <input
              className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs"
              placeholder="Replacement player name"
              value={replacementName}
              onChange={(e) => setReplacementName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs"
                placeholder="Team (e.g. ARS)"
                value={replacementTeam}
                onChange={(e) => setReplacementTeam(e.target.value)}
              />
              <select
                className="w-20 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs"
                value={replacementPosition}
                onChange={(e) =>
                  setReplacementPosition(
                    e.target.value as "GK" | "DEF" | "MID" | "FWD"
                  )
                }
              >
                <option value="GK">GK</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="FWD">FWD</option>
              </select>
            </div>
            <button
              onClick={handleTransferOut}
              className="w-full rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500"
            >
              {replacementName
                ? `Transfer out → ${replacementName}`
                : "Transfer out (no replacement)"}
            </button>
          </div>
        </div>

        {/* Chips section */}
        <div>
          <div className="text-xs font-medium text-slate-300 mb-2">
            Chips for GW{gameweek}
          </div>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => {
              const isActive = activeChips.some((c) => c.chip === chip);
              return (
                <button
                  key={chip}
                  onClick={() => handleToggleChip(chip)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                    isActive
                      ? "bg-amber-600 border-amber-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            WC = Wildcard, FH = Free Hit, BB = Bench Boost, TC = Triple Captain
          </p>
        </div>
      </div>
    </div>
  );
}
