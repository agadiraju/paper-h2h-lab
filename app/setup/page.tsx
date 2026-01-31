"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";
import {
  fetchEntry,
  fetchBootstrap,
  fetchPicks,
  getOpponentsForRange,
  mapPosition,
  getCurrentGameweek
} from "@/lib/api/fpl";
import {
  H2HLeague,
  Player,
  PlayerSlot,
  Opponent,
  createEmptyPlan,
  MAX_PLANS,
  MAX_GW_SPAN
} from "@/lib/models";

type Step = "fpl-id" | "import-squad" | "create-plan";

export default function SetupPage() {
  const router = useRouter();
  const {
    fplTeamId,
    fplTeamName,
    h2hLeagues,
    plans,
    setupComplete,
    setFplTeamInfo,
    setH2HLeagues,
    setSetupComplete,
    addPlan,
    setActivePlan
  } = useUserStore();

  const [step, setStep] = useState<Step>("fpl-id");
  const [inputTeamId, setInputTeamId] = useState(fplTeamId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Squad import state
  const [importedPlayers, setImportedPlayers] = useState<Player[]>([]);
  const [currentGW, setCurrentGW] = useState<number>(1);

  // Plan creation state
  const [planName, setPlanName] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [startGW, setStartGW] = useState<number>(1);
  const [endGW, setEndGW] = useState<number>(7);
  const [opponentPreview, setOpponentPreview] = useState<Record<number, Opponent>>({});
  const [loadingOpponents, setLoadingOpponents] = useState(false);

  // Redirect if already set up and has plans
  useEffect(() => {
    if (setupComplete && plans.length > 0) {
      router.push("/planner");
    }
  }, [setupComplete, plans, router]);

  // Step 1: Connect FPL ID
  const handleConnectFPL = async () => {
    if (!inputTeamId.trim()) {
      setError("Please enter your FPL Team ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const entry = await fetchEntry(inputTeamId.trim());
      const gw = await getCurrentGameweek();

      const managerName = `${entry.player_first_name} ${entry.player_last_name}`;
      setFplTeamInfo(String(entry.id), entry.name, managerName);

      // Extract H2H leagues
      const leagues: H2HLeague[] = entry.leagues.h2h.map((l) => ({
        id: l.id,
        name: l.name,
        entryRank: l.entry_rank
      }));
      setH2HLeagues(leagues);
      setCurrentGW(gw);
      
      // Set start/end GW to current and +6 (max 38)
      setStartGW(gw);
      setEndGW(Math.min(gw + MAX_GW_SPAN - 1, 38));

      if (leagues.length === 0) {
        setError("No H2H leagues found. This tool is designed for H2H leagues.");
        return;
      }

      setSelectedLeagueId(leagues[0].id);
      setStep("import-squad");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Import Squad
  const handleImportSquad = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bootstrap, picks] = await Promise.all([
        fetchBootstrap(),
        fetchPicks(fplTeamId, currentGW)
      ]);

      // Map picks to players
      const players: Player[] = picks.picks.map((pick) => {
        const element = bootstrap.elements.find((e) => e.id === pick.element);
        const team = bootstrap.teams.find((t) => t.id === element?.team);

        return {
          id: String(pick.element),
          name: element?.web_name ?? "Unknown",
          team: team?.short_name ?? "???",
          position: mapPosition(element?.element_type ?? 3)
        };
      });

      setImportedPlayers(players);
      setStep("create-plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import squad");
    } finally {
      setLoading(false);
    }
  };

  // Fetch opponents when league or GW range changes
  const fetchOpponents = useCallback(async () => {
    if (!selectedLeagueId || !fplTeamId) return;

    setLoadingOpponents(true);
    setOpponentPreview({}); // Clear while loading

    try {
      const opponents = await getOpponentsForRange(
        String(selectedLeagueId),
        Number(fplTeamId),
        startGW,
        endGW
      );
      setOpponentPreview(opponents);
    } catch (err) {
      console.error("Failed to fetch opponents:", err);
      // Don't set error - just show TBD
    } finally {
      setLoadingOpponents(false);
    }
  }, [selectedLeagueId, startGW, endGW, fplTeamId]);

  // Trigger opponent fetch when on create-plan step and dependencies change
  useEffect(() => {
    if (step === "create-plan" && selectedLeagueId && fplTeamId) {
      fetchOpponents();
    }
  }, [step, selectedLeagueId, startGW, endGW, fplTeamId, fetchOpponents]);

  // Step 3: Create Plan
  const handleCreatePlan = () => {
    if (!planName.trim()) {
      setError("Please enter a plan name");
      return;
    }
    if (!selectedLeagueId) {
      setError("Please select a league");
      return;
    }
    if (endGW - startGW >= MAX_GW_SPAN) {
      setError(`Plan can span at most ${MAX_GW_SPAN} gameweeks`);
      return;
    }
    if (plans.length >= MAX_PLANS) {
      setError(`Maximum ${MAX_PLANS} plans allowed`);
      return;
    }

    const league = h2hLeagues.find((l) => l.id === selectedLeagueId);
    const planId = `plan-${Date.now()}`;

    const plan = createEmptyPlan(
      planId,
      planName.trim(),
      selectedLeagueId,
      league?.name ?? "Unknown League",
      startGW,
      endGW
    );

    // Populate squad with imported players
    const perGameweekSlots: Record<number, PlayerSlot[]> = {};
    for (let gw = startGW; gw <= endGW; gw++) {
      perGameweekSlots[gw] = importedPlayers.map((p, idx) => ({
        playerId: p.id,
        role: idx < 11 ? "XI" : "BENCH"
      }));
    }

    plan.squad = {
      players: importedPlayers,
      perGameweekSlots
    };
    plan.opponents = opponentPreview;

    addPlan(plan);
    setActivePlan(planId);
    setSetupComplete(true);
    router.push("/planner");
  };

  const selectedLeague = h2hLeagues.find((l) => l.id === selectedLeagueId);

  // Generate GW options - only current GW and future (1-38)
  const futureGWOptions = Array.from({ length: 38 }, (_, i) => i + 1).filter(
    (gw) => gw >= currentGW
  );

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["fpl-id", "import-squad", "create-plan"].map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                  step === s
                    ? "bg-primary border-primary text-white"
                    : idx <
                      ["fpl-id", "import-squad", "create-plan"].indexOf(step)
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-paper-dark border-border text-ink-lighter"
                }`}
              >
                {idx + 1}
              </div>
              {idx < 2 && (
                <div className="w-8 h-px bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-lg border-2 border-border bg-paper-dark p-6 paper-shadow">
          {/* Step 1: FPL ID */}
          {step === "fpl-id" && (
            <>
              <h1 className="text-xl font-semibold text-ink mb-2">
                Connect your FPL account
              </h1>
              <p className="text-sm text-ink-lighter mb-6 leading-relaxed">
                Enter your FPL Team ID to import your squad and H2H leagues.
                You can find it in your team's URL on the FPL website.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-lighter mb-1">
                    FPL Team ID
                  </label>
                  <input
                    type="text"
                    className="w-full rounded border-2 border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 1234567"
                    value={inputTeamId}
                    onChange={(e) => setInputTeamId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConnectFPL()}
                  />
                  <p className="text-[11px] text-ink-lighter mt-1">
                    Find it at: fantasy.premierleague.com/entry/[YOUR_ID]/event/...
                  </p>
                </div>

                {error && (
                  <div className="text-xs text-danger bg-danger/10 border-2 border-danger/30 rounded px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleConnectFPL}
                  disabled={loading}
                  className="w-full rounded border-2 border-primary bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark hover:border-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Connecting..." : "Connect"}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Import Squad */}
          {step === "import-squad" && (
            <>
              <h1 className="text-xl font-semibold text-ink mb-2">
                Import your squad
              </h1>
              <p className="text-sm text-ink-lighter mb-6 leading-relaxed">
                We'll import your current squad from GW{currentGW} as the
                starting point for your plan.
              </p>

              <div className="rounded border-2 border-border bg-paper p-4 mb-6">
                <div className="text-sm font-semibold text-ink mb-1">
                  {fplTeamName}
                </div>
                <div className="text-xs text-ink-lighter">
                  {h2hLeagues.length} H2H league{h2hLeagues.length !== 1 && "s"} found
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {h2hLeagues.slice(0, 3).map((l) => (
                    <span
                      key={l.id}
                      className="text-[10px] px-2 py-0.5 rounded border border-border bg-paper-dark text-ink"
                    >
                      {l.name}
                    </span>
                  ))}
                  {h2hLeagues.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-paper-dark text-ink-lighter">
                      +{h2hLeagues.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-xs text-danger bg-danger/10 border-2 border-danger/30 rounded px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("fpl-id")}
                  className="flex-1 rounded border-2 border-border bg-paper px-4 py-2 text-sm text-ink-light hover:bg-paper-darker transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImportSquad}
                  disabled={loading}
                  className="flex-1 rounded border-2 border-primary bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark hover:border-primary-dark disabled:opacity-50 transition-colors"
                >
                  {loading ? "Importing..." : "Import Squad"}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Create Plan */}
          {step === "create-plan" && (
            <>
              <h1 className="text-xl font-semibold text-ink mb-2">
                Create your plan
              </h1>
              <p className="text-sm text-ink-lighter mb-6 leading-relaxed">
                Set up a planning window for one of your H2H leagues.
              </p>

              <div className="space-y-4">
                {/* Squad preview */}
                <div className="rounded border-2 border-border bg-paper p-3">
                  <div className="text-xs font-medium text-ink-lighter mb-2">
                    Imported squad ({importedPlayers.length} players)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {importedPlayers.slice(0, 8).map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-paper-dark text-ink"
                      >
                        {p.name}
                      </span>
                    ))}
                    {importedPlayers.length > 8 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-paper-dark text-ink-lighter">
                        +{importedPlayers.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan name */}
                <div>
                  <label className="block text-xs font-medium text-ink-lighter mb-1">
                    Plan name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded border-2 border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. ML Cup Push, Work League"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>

                {/* League selection */}
                <div>
                  <label className="block text-xs font-medium text-ink-lighter mb-1">
                    H2H League
                  </label>
                  <select
                    className="w-full rounded border-2 border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary transition-colors"
                    value={selectedLeagueId ?? ""}
                    onChange={(e) => setSelectedLeagueId(Number(e.target.value))}
                  >
                    {h2hLeagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GW range */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-ink-lighter mb-1">
                      Start GW
                    </label>
                    <select
                      className="w-full rounded border-2 border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary transition-colors"
                      value={startGW}
                      onChange={(e) => {
                        const newStart = Number(e.target.value);
                        setStartGW(newStart);
                        // Adjust endGW if needed
                        if (endGW < newStart) {
                          setEndGW(newStart);
                        }
                        if (endGW - newStart >= MAX_GW_SPAN) {
                          setEndGW(newStart + MAX_GW_SPAN - 1);
                        }
                      }}
                    >
                      {futureGWOptions.map((gw) => (
                        <option key={gw} value={gw}>
                          GW{gw}{gw === currentGW ? " (current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-ink-lighter mb-1">
                      End GW
                    </label>
                    <select
                      className="w-full rounded border-2 border-border bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary transition-colors"
                      value={endGW}
                      onChange={(e) => setEndGW(Number(e.target.value))}
                    >
                      {futureGWOptions
                        .filter(
                          (gw) => gw >= startGW && gw < startGW + MAX_GW_SPAN
                        )
                        .map((gw) => (
                          <option key={gw} value={gw}>
                            GW{gw}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-ink-lighter">
                  Max {MAX_GW_SPAN} gameweeks per plan. Only current and future gameweeks available.
                </p>

                {/* Opponent preview */}
                <div>
                  <label className="block text-xs font-medium text-ink-lighter mb-2">
                    Opponent schedule
                  </label>
                  <div className="rounded border-2 border-border bg-paper p-2 space-y-1 max-h-32 overflow-y-auto">
                    {loadingOpponents ? (
                      <div className="text-xs text-ink-lighter py-2 text-center">
                        Loading opponents...
                      </div>
                    ) : (
                      Array.from(
                        { length: endGW - startGW + 1 },
                        (_, i) => startGW + i
                      ).map((gw) => (
                        <div
                          key={gw}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-ink-lighter">GW{gw}</span>
                          <span className="text-ink font-medium">
                            {opponentPreview[gw]
                              ? `vs ${opponentPreview[gw].teamName}`
                              : "TBD"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-danger bg-danger/10 border-2 border-danger/30 rounded px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep("import-squad")}
                    className="flex-1 rounded border-2 border-border bg-paper px-4 py-2 text-sm text-ink-light hover:bg-paper-darker transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreatePlan}
                    className="flex-1 rounded border-2 border-primary bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark hover:border-primary-dark transition-colors"
                  >
                    Create Plan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Existing plans indicator */}
        {plans.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/planner")}
              className="text-xs text-ink-lighter hover:text-ink underline-offset-4 hover:underline"
            >
              You have {plans.length} existing plan{plans.length !== 1 && "s"} →
              Go to planner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
