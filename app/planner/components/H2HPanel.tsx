"use client";

import { useUserStore } from "@/lib/store/userStore";
import { computeHeadToHeadRisk } from "@/lib/h2hLogic";
import { useMemo, useState } from "react";
import { Player } from "@/lib/models";

export default function H2HPanel() {
  const { getActivePlan, updatePlan } = useUserStore();
  const activePlan = getActivePlan();

  const [selectedGW, setSelectedGW] = useState<number | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("");

  // Auto-select first GW with opponent on mount
  useMemo(() => {
    if (activePlan && selectedGW === null) {
      const firstGWWithOpponent = Object.keys(activePlan.opponents)
        .map(Number)
        .sort((a, b) => a - b)[0];
      if (firstGWWithOpponent) {
        setSelectedGW(firstGWWithOpponent);
      } else {
        setSelectedGW(activePlan.startGW);
      }
    }
  }, [activePlan, selectedGW]);

  const h2hResult = useMemo(() => {
    if (!activePlan || !selectedGW) return null;

    const myPlayers = activePlan.squad.players;
    const theirPlayers = activePlan.opponentSquads[selectedGW]?.players ?? [];
    const myCaptainId = activePlan.captains[selectedGW];

    return computeHeadToHeadRisk(
      myPlayers,
      theirPlayers,
      selectedGW,
      myCaptainId,
      undefined
    );
  }, [activePlan, selectedGW]);

  if (!activePlan) return null;

  const visibleGWs: number[] = [];
  for (let gw = activePlan.startGW; gw <= activePlan.endGW; gw++) {
    visibleGWs.push(gw);
  }

  const opponent = selectedGW ? activePlan.opponents[selectedGW] : null;
  const opponentSquad = selectedGW
    ? activePlan.opponentSquads[selectedGW]?.players ?? []
    : [];

  const handleAddOpponentPlayer = () => {
    if (!selectedGW || !newPlayerName || !newPlayerTeam) return;

    const newPlayer: Player = {
      id: `opp-${Date.now()}`,
      name: newPlayerName,
      team: newPlayerTeam.toUpperCase(),
      position: "MID"
    };

    const existing = activePlan.opponentSquads[selectedGW]?.players ?? [];
    updatePlan(activePlan.id, {
      opponentSquads: {
        ...activePlan.opponentSquads,
        [selectedGW]: { players: [...existing, newPlayer] }
      }
    });

    setNewPlayerName("");
    setNewPlayerTeam("");
  };

  const handleRemoveOpponentPlayer = (playerId: string) => {
    if (!selectedGW) return;

    const existing = activePlan.opponentSquads[selectedGW]?.players ?? [];
    updatePlan(activePlan.id, {
      opponentSquads: {
        ...activePlan.opponentSquads,
        [selectedGW]: { players: existing.filter((p) => p.id !== playerId) }
      }
    });
  };

  const riskColors = {
    green: "bg-green-900/50 border-green-700 text-green-400",
    amber: "bg-amber-900/50 border-amber-700 text-amber-400",
    red: "bg-red-900/50 border-red-700 text-red-400"
  };

  return (
    <div className="p-3">
      <h2 className="text-xs font-semibold mb-3 text-slate-200 uppercase tracking-wide">
        H2H comparison
      </h2>

      <div className="space-y-3 text-xs">
        {/* GW selector */}
        <div>
          <label className="text-slate-400 block mb-1">Gameweek</label>
          <select
            className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs"
            value={selectedGW ?? ""}
            onChange={(e) => setSelectedGW(Number(e.target.value))}
          >
            {visibleGWs.map((gw) => (
              <option key={gw} value={gw}>
                GW{gw}
                {activePlan.opponents[gw]
                  ? ` vs ${activePlan.opponents[gw].teamName}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedGW && (
          <>
            {/* Opponent info */}
            {opponent && (
              <div className="rounded border border-slate-800 bg-slate-800/50 p-2">
                <div className="text-[11px] text-slate-400">Opponent</div>
                <div className="text-sm font-medium text-slate-200">
                  {opponent.teamName}
                </div>
                <div className="text-[10px] text-slate-500">
                  {opponent.managerName}
                </div>
              </div>
            )}

            {/* Opponent squad input */}
            <div className="border border-slate-800 rounded p-2">
              <div className="text-[11px] text-slate-400 mb-1">
                Opponent squad ({opponentSquad.length} players)
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto mb-2">
                {opponentSquad.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-slate-300">
                      {p.name}{" "}
                      <span className="text-slate-500">({p.team})</span>
                    </span>
                    <button
                      onClick={() => handleRemoveOpponentPlayer(p.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {opponentSquad.length === 0 && (
                  <div className="text-[10px] text-slate-600 italic">
                    Add opponent players to see comparison
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <input
                  className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px]"
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <input
                  className="w-12 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px]"
                  placeholder="Team"
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                />
                <button
                  onClick={handleAddOpponentPlayer}
                  className="px-2 py-1 rounded bg-slate-700 text-[11px] hover:bg-slate-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* H2H result */}
            {h2hResult && opponentSquad.length > 0 && (
              <div className="space-y-2 mt-3">
                <div
                  className={`rounded border px-2 py-1.5 text-center ${
                    riskColors[h2hResult.riskLevel]
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-70">
                    Risk level
                  </div>
                  <div className="text-sm font-semibold capitalize">
                    {h2hResult.riskLevel}
                  </div>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Overlap</span>
                  <span className="text-slate-200">
                    {h2hResult.overlapPercentage}%
                  </span>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1">
                    Your differentials ({h2hResult.myDifferentials.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {h2hResult.myDifferentials.slice(0, 6).map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-800"
                      >
                        {p.name}
                      </span>
                    ))}
                    {h2hResult.myDifferentials.length > 6 && (
                      <span className="text-[10px] text-slate-500">
                        +{h2hResult.myDifferentials.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1">
                    Their differentials ({h2hResult.theirDifferentials.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {h2hResult.theirDifferentials.slice(0, 6).map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800"
                      >
                        {p.name}
                      </span>
                    ))}
                    {h2hResult.theirDifferentials.length > 6 && (
                      <span className="text-[10px] text-slate-500">
                        +{h2hResult.theirDifferentials.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
