"use client";

import { useUserStore } from "@/lib/store/userStore";
import { computeHeadToHeadRisk } from "@/lib/h2hLogic";
import { isTeamDoubling } from "@/lib/plannerLogic";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { Player, Position } from "@/lib/models";
import { fetchOpponentSquad } from "@/lib/api/fpl";

interface H2HComparisonModalProps {
  gameweek: number;
  onClose: () => void;
}

const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

type LoadingState = "idle" | "loading" | "success" | "error";

export default function H2HComparisonModal({
  gameweek,
  onClose
}: H2HComparisonModalProps) {
  const { getActivePlan, updatePlan } = useUserStore();
  const activePlan = getActivePlan();

  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [opponentCaptainId, setOpponentCaptainId] = useState<string | undefined>();
  const [dataFromGW, setDataFromGW] = useState<number | null>(null);
  const fetchInitiatedRef = useRef(false);

  const opponent = activePlan?.opponents[gameweek] ?? null;
  const existingOpponentSquad = activePlan?.opponentSquads[gameweek]?.players ?? [];

  // Fetch opponent squad from FPL API
  const fetchSquad = useCallback(async () => {
    if (!activePlan || !opponent) return;

    setLoadingState("loading");
    setErrorMessage("");
    setDataFromGW(null);

    try {
      const result = await fetchOpponentSquad(opponent.teamId, gameweek);

      if (!result) {
        setErrorMessage("No opponent picks available for any gameweek.");
        setLoadingState("error");
        return;
      }

      // Convert to Player format and save
      const players: Player[] = result.players
        .filter((p) => p.isStarting) // Only starting XI for comparison
        .map((p) => ({
          id: p.id,
          name: p.name,
          team: p.team,
          position: p.position
        }));

      // Find captain
      const captain = result.players.find((p) => p.isCaptain);
      if (captain) {
        setOpponentCaptainId(captain.id);
      }

      // Track which GW the data came from
      setDataFromGW(result.fetchedFromGW);

      // Update the plan with fetched squad
      updatePlan(activePlan.id, {
        opponentSquads: {
          ...activePlan.opponentSquads,
          [gameweek]: { players }
        }
      });

      setLoadingState("success");
    } catch (err) {
      console.error("Failed to fetch opponent squad:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch opponent squad"
      );
      setLoadingState("error");
    }
  }, [activePlan, opponent, gameweek, updatePlan]);

  // Auto-fetch on mount if needed (legitimate data fetching pattern)
  useEffect(() => {
    if (
      activePlan &&
      opponent &&
      existingOpponentSquad.length === 0 &&
      !fetchInitiatedRef.current
    ) {
      fetchInitiatedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSquad();
    }
  }, [activePlan, opponent, existingOpponentSquad.length, fetchSquad]);

  const { myXI, myBench, opponentPlayers, h2hResult, myCaptainId } = useMemo(() => {
    if (!activePlan) {
      return {
        myXI: [],
        myBench: [],
        opponentPlayers: [],
        h2hResult: null,
        myCaptainId: undefined
      };
    }

    const slots = activePlan.squad.perGameweekSlots[gameweek] ?? [];
    const xiSlots = slots.filter((s) => s.role === "XI");
    const benchSlots = slots.filter((s) => s.role === "BENCH");

    const getPlayer = (playerId: string) =>
      activePlan.squad.players.find((p) => p.id === playerId);

    const myXI = xiSlots
      .map((s) => getPlayer(s.playerId))
      .filter((p): p is Player => p !== undefined);

    const myBench = benchSlots
      .map((s) => getPlayer(s.playerId))
      .filter((p): p is Player => p !== undefined);

    const opponentPlayers =
      activePlan.opponentSquads[gameweek]?.players ?? [];
    const myCaptainId = activePlan.captains[gameweek];

    const h2hResult = computeHeadToHeadRisk(
      [...myXI, ...myBench],
      opponentPlayers,
      gameweek,
      myCaptainId,
      opponentCaptainId,
      activePlan
    );

    return {
      myXI,
      myBench,
      opponentPlayers,
      h2hResult,
      myCaptainId
    };
  }, [activePlan, gameweek, opponentCaptainId]);

  if (!activePlan) return null;

  const riskColors = {
    green: "bg-green-900/50 border-green-700 text-green-400",
    amber: "bg-amber-900/50 border-amber-700 text-amber-400",
    red: "bg-red-900/50 border-red-700 text-red-400"
  };

  const theirPlayerIds = new Set(opponentPlayers.map((p) => p.id));
  const myPlayerIds = new Set([...myXI, ...myBench].map((p) => p.id));

  const groupByPosition = (players: Player[]) => {
    const grouped: Record<Position, Player[]> = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: []
    };
    for (const player of players) {
      grouped[player.position].push(player);
    }
    return grouped;
  };

  const myXIByPosition = groupByPosition(myXI);
  const myBenchByPosition = groupByPosition(myBench);
  const opponentByPosition = groupByPosition(opponentPlayers);

  const renderPlayerCard = (
    player: Player,
    options: {
      isMine: boolean;
      isCaptain?: boolean;
      isBench?: boolean;
    }
  ) => {
    const { isMine, isCaptain, isBench } = options;
    const isDGW = isTeamDoubling(player.team, gameweek, activePlan);

    // Determine differential status
    const isMyDifferential = isMine && !theirPlayerIds.has(player.id);
    const isTheirDifferential = !isMine && !myPlayerIds.has(player.id);
    const isOverlap = isMine
      ? theirPlayerIds.has(player.id)
      : myPlayerIds.has(player.id);

    let cardStyle = "bg-slate-800/50 border-slate-700 text-slate-300";
    if (isMyDifferential) {
      cardStyle = "bg-green-900/30 border-green-700 text-green-400";
    } else if (isTheirDifferential) {
      cardStyle = "bg-red-900/30 border-red-700 text-red-400";
    } else if (isOverlap) {
      cardStyle = "bg-slate-800/50 border-slate-700 text-slate-300";
    }

    return (
      <div
        key={player.id}
        className={`flex items-center justify-between rounded border px-2 py-1.5 text-xs ${cardStyle}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{player.name}</span>
          <span className="text-[10px] opacity-60">{player.team}</span>
        </div>
        <div className="flex items-center gap-1">
          {isDGW && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-purple-900/50 text-purple-400 border border-purple-700">
              DGW
            </span>
          )}
          {isCaptain && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700">
              C
            </span>
          )}
          {isBench && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600">
              B
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderPositionSection = (
    position: Position,
    myPlayers: Player[],
    theirPlayers: Player[],
    isBenchSection?: boolean
  ) => {
    if (myPlayers.length === 0 && theirPlayers.length === 0) return null;

    return (
      <div key={position + (isBenchSection ? "-bench" : "")} className="mb-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
          {position}
          {isBenchSection && " (Bench)"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* My players */}
          <div className="space-y-1">
            {myPlayers.length > 0 ? (
              myPlayers.map((p) =>
                renderPlayerCard(p, {
                  isMine: true,
                  isCaptain: p.id === myCaptainId,
                  isBench: isBenchSection
                })
              )
            ) : (
              <div className="text-[11px] text-slate-600 italic">-</div>
            )}
          </div>
          {/* Their players */}
          <div className="space-y-1">
            {theirPlayers.length > 0 ? (
              theirPlayers.map((p) =>
                renderPlayerCard(p, {
                  isMine: false,
                  isCaptain: p.id === opponentCaptainId
                })
              )
            ) : (
              <div className="text-[11px] text-slate-600 italic">-</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-lg border border-slate-800 bg-slate-950 p-5 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              GW{gameweek} H2H Comparison
            </h3>
            {opponent && (
              <p className="text-sm text-slate-400">
                vs {opponent.teamName}
                <span className="text-slate-500 ml-1">
                  ({opponent.managerName})
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl px-2"
          >
            ×
          </button>
        </div>

        {/* No opponent configured */}
        {!opponent ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">
              No opponent configured for this gameweek.
            </p>
          </div>
        ) : loadingState === "loading" ? (
          /* Loading state */
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-600 border-t-slate-300 mb-3"></div>
            <p className="text-slate-400 text-sm">
              Fetching opponent squad from FPL...
            </p>
          </div>
        ) : loadingState === "error" ? (
          /* Error state */
          <div className="py-12 text-center">
            <p className="text-red-400 text-sm mb-3">{errorMessage}</p>
            <button
              onClick={fetchSquad}
              className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        ) : opponentPlayers.length === 0 ? (
          /* Empty state (after fetch returned no data) */
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">
              No opponent squad data available.
            </p>
            <button
              onClick={fetchSquad}
              className="mt-3 px-4 py-2 rounded bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            {/* GW mismatch notice */}
            {dataFromGW && dataFromGW !== gameweek && (
              <div className="rounded border border-amber-800 bg-amber-900/30 px-3 py-2 mb-4 text-xs text-amber-400">
                Showing opponent&apos;s squad from GW{dataFromGW} (most recent available)
              </div>
            )}

            {/* Risk banner */}
            {h2hResult && (
              <div
                className={`rounded border px-4 py-3 mb-5 flex items-center justify-between ${
                  riskColors[h2hResult.riskLevel]
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wide opacity-70 mr-2">
                    Risk Level:
                  </span>
                  <span className="font-semibold capitalize">
                    {h2hResult.riskLevel}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="opacity-70">Overlap: </span>
                    <span className="font-medium">
                      {h2hResult.overlapPercentage}%
                    </span>
                  </div>
                  <button
                    onClick={fetchSquad}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                    title="Refresh opponent squad"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Two-column layout header */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Your Squad
              </div>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Opponent Squad
              </div>
            </div>

            {/* Players by position - Starting XI */}
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-2 pb-1 border-b border-slate-800">
                Starting XI
              </div>
              {POSITION_ORDER.map((pos) =>
                renderPositionSection(
                  pos,
                  myXIByPosition[pos],
                  opponentByPosition[pos]
                )
              )}
            </div>

            {/* Bench section */}
            {myBench.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-400 mb-2 pb-1 border-b border-slate-800">
                  Bench
                </div>
                {POSITION_ORDER.map((pos) =>
                  myBenchByPosition[pos].length > 0
                    ? renderPositionSection(
                        pos,
                        myBenchByPosition[pos],
                        [], // Opponent bench not tracked
                        true
                      )
                    : null
                )}
              </div>
            )}

            {/* Differentials summary */}
            {h2hResult && (
              <div className="border-t border-slate-800 pt-4 mt-4">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
                  Differentials Summary
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* My differentials */}
                  <div>
                    <div className="text-[11px] text-green-400 mb-2">
                      Your differentials ({h2hResult.myDifferentials.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {h2hResult.myDifferentials.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-800"
                        >
                          {p.name}
                        </span>
                      ))}
                      {h2hResult.myDifferentials.length === 0 && (
                        <span className="text-[10px] text-slate-500 italic">
                          None
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Their differentials */}
                  <div>
                    <div className="text-[11px] text-red-400 mb-2">
                      Their differentials ({h2hResult.theirDifferentials.length}
                      )
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {h2hResult.theirDifferentials.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800"
                        >
                          {p.name}
                        </span>
                      ))}
                      {h2hResult.theirDifferentials.length === 0 && (
                        <span className="text-[10px] text-slate-500 italic">
                          None
                        </span>
                      )}
                    </div>
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
