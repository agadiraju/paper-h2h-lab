"use client";

import { useUserStore } from "@/lib/store/userStore";
import PlayerTile from "./PlayerTile";
import { useMemo, useState } from "react";
import { ChipType } from "@/lib/models";
import H2HComparisonModal from "./H2HComparisonModal";

interface GameweekColumnProps {
  gameweek: number;
}

export default function GameweekColumn({ gameweek }: GameweekColumnProps) {
  const { getActivePlan } = useUserStore();
  const activePlan = getActivePlan();
  const [showH2HModal, setShowH2HModal] = useState(false);

  if (!activePlan) return null;

  const slots = activePlan.squad.perGameweekSlots[gameweek] ?? [];
  const opponent = activePlan.opponents[gameweek];
  
  // Get chips for this GW
  const chips = activePlan.planEvents.filter(
    (ev): ev is { type: "CHIP"; gameweek: number; chip: ChipType } =>
      ev.type === "CHIP" && ev.gameweek === gameweek
  );

  const { xiPlayers, benchPlayers } = useMemo(() => {
    const xi: typeof slots = [];
    const bench: typeof slots = [];

    for (const slot of slots) {
      if (slot.role === "XI") {
        xi.push(slot);
      } else {
        bench.push(slot);
      }
    }

    return { xiPlayers: xi, benchPlayers: bench };
  }, [slots]);

  const getPlayer = (playerId: string) =>
    activePlan.squad.players.find((p) => p.id === playerId);

  return (
    <div className="w-44 flex-shrink-0 rounded-lg border-2 border-border bg-paper-dark paper-shadow flex flex-col group">
      {/* Header */}
      <div
        className="px-3 py-2 border-b-2 border-border cursor-pointer hover:bg-paper-darker transition-colors"
        onClick={() => setShowH2HModal(true)}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">
            GW{gameweek}
          </span>
          <span className="text-[10px] text-ink-lighter opacity-0 group-hover:opacity-100 transition-opacity">
            View H2H
          </span>
        </div>
        {opponent && (
          <div className="text-[11px] text-ink-lighter mt-0.5">
            vs {opponent.teamName}
          </div>
        )}
        {chips.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip.chip}
                className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/40 font-semibold"
              >
                {chip.chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Starting XI */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] text-ink-lighter uppercase tracking-wide mb-1 font-semibold">
          Starting XI ({xiPlayers.length})
        </div>
        {xiPlayers.map((slot) => {
          const player = getPlayer(slot.playerId);
          if (!player) return null;
          return (
            <PlayerTile
              key={slot.playerId}
              player={player}
              gameweek={gameweek}
              role="XI"
            />
          );
        })}
        {xiPlayers.length === 0 && (
          <div className="text-[11px] text-ink-lighter/50 italic">No XI set</div>
        )}
      </div>

      {/* Bench */}
      <div className="border-t-2 border-border p-2 space-y-1">
        <div className="text-[10px] text-ink-lighter uppercase tracking-wide mb-1 font-semibold">
          Bench ({benchPlayers.length})
        </div>
        {benchPlayers.slice(0, 4).map((slot) => {
          const player = getPlayer(slot.playerId);
          if (!player) return null;
          return (
            <PlayerTile
              key={slot.playerId}
              player={player}
              gameweek={gameweek}
              role="BENCH"
            />
          );
        })}
        {benchPlayers.length === 0 && (
          <div className="text-[11px] text-ink-lighter/50 italic">No bench</div>
        )}
      </div>

      {/* H2H Comparison Modal */}
      {showH2HModal && (
        <H2HComparisonModal
          gameweek={gameweek}
          onClose={() => setShowH2HModal(false)}
        />
      )}
    </div>
  );
}
