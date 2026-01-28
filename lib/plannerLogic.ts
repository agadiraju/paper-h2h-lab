// lib/plannerLogic.ts
// Core planning logic for Paper H2H Lab.

import {
  Squad,
  PlanEvent,
  Player,
  ChipEvent,
  TransferInEvent,
  TransferOutEvent,
  Plan
} from "./models";
import { DOUBLE_GAMEWEEK_TEAMS, BLANK_GAMEWEEK_TEAMS } from "./fixtures";

/**
 * Check if a team has a double gameweek.
 * Checks both API-detected fixtures and manual overrides from the plan.
 * Manual overrides take precedence.
 */
export function isTeamDoubling(
  team: string,
  gameweek: number,
  plan?: Plan,
  apiDGWTeams?: string[]
): boolean {
  const teamUpper = team.toUpperCase();

  // Check manual overrides first (if plan provided)
  if (plan?.manualDGW[gameweek]?.includes(teamUpper)) {
    return true;
  }

  // Check if manually marked as blanking (takes precedence)
  if (plan?.manualBGW[gameweek]?.includes(teamUpper)) {
    return false;
  }

  // Check API-detected DGWs (if provided)
  if (apiDGWTeams?.includes(teamUpper)) {
    return true;
  }

  // Fall back to hardcoded data (legacy/mock)
  const doublingTeams = DOUBLE_GAMEWEEK_TEAMS[gameweek] ?? [];
  return doublingTeams.includes(teamUpper);
}

/**
 * Check if a team has a blank gameweek.
 */
export function isTeamBlanking(
  team: string,
  gameweek: number,
  plan?: Plan,
  apiBGWTeams?: string[]
): boolean {
  const teamUpper = team.toUpperCase();

  // Check manual overrides first
  if (plan?.manualBGW[gameweek]?.includes(teamUpper)) {
    return true;
  }

  // Check if manually marked as doubling (takes precedence)
  if (plan?.manualDGW[gameweek]?.includes(teamUpper)) {
    return false;
  }

  // Check API-detected BGWs (if provided)
  if (apiBGWTeams?.includes(teamUpper)) {
    return true;
  }

  // Fall back to hardcoded data
  const blankingTeams = BLANK_GAMEWEEK_TEAMS[gameweek] ?? [];
  return blankingTeams.includes(teamUpper);
}

/**
 * Check if Bench Boost is active for a gameweek.
 */
export function isBenchBoostActive(
  planEvents: PlanEvent[],
  gameweek: number
): boolean {
  return planEvents.some(
    (ev) => ev.type === "CHIP" && ev.gameweek === gameweek && ev.chip === "BB"
  );
}

/**
 * Get all chip events for a specific gameweek.
 */
export function getChipsForGW(
  planEvents: PlanEvent[],
  gameweek: number
): ChipEvent[] {
  return planEvents.filter(
    (ev): ev is ChipEvent => ev.type === "CHIP" && ev.gameweek === gameweek
  );
}

/**
 * Apply plan events (transfers) to a base squad up to a given gameweek.
 * Returns a new Squad reflecting all transfers in/out.
 */
export function applyPlanEventsUpToGW(
  baseSquad: Squad,
  events: PlanEvent[],
  targetGW: number
): Squad {
  // Filter events up to and including targetGW
  const relevantEvents = events.filter((ev) => ev.gameweek <= targetGW);

  // Separate transfer events
  const transfersOut = relevantEvents.filter(
    (ev): ev is TransferOutEvent => ev.type === "TRANSFER_OUT"
  );
  const transfersIn = relevantEvents.filter(
    (ev): ev is TransferInEvent => ev.type === "TRANSFER_IN"
  );

  // Build set of removed player IDs
  const removedIds = new Set(transfersOut.map((t) => t.playerId));

  // Start with base players, remove transferred out
  let players = baseSquad.players.filter((p) => !removedIds.has(p.id));

  // Add transferred in players
  for (const transfer of transfersIn) {
    if (transfer.playerData) {
      players.push(transfer.playerData);
    }
  }

  // Update per-gameweek slots
  const perGameweekSlots = { ...baseSquad.perGameweekSlots };

  for (const gw of Object.keys(perGameweekSlots).map(Number)) {
    if (gw > targetGW) continue;

    // Remove slots for transferred out players
    perGameweekSlots[gw] = perGameweekSlots[gw].filter(
      (slot) => !removedIds.has(slot.playerId)
    );

    // Add slots for transferred in players (effective from their GW)
    for (const transfer of transfersIn) {
      if (transfer.gameweek <= gw && transfer.playerData) {
        const exists = perGameweekSlots[gw].some(
          (s) => s.playerId === transfer.playerData!.id
        );
        if (!exists) {
          perGameweekSlots[gw].push({
            playerId: transfer.playerData.id,
            role: "BENCH"
          });
        }
      }
    }
  }

  return {
    players,
    perGameweekSlots
  };
}

/**
 * Compute squad summary statistics for a gameweek.
 */
export function computeSquadSummaryForGW(
  squad: Squad,
  gameweek: number,
  options: { includeBench?: boolean; plan?: Plan } = {}
): {
  totalPlayers: number;
  xiCount: number;
  benchCount: number;
  doublingPlayers: Player[];
  positionCounts: Record<string, number>;
} {
  const slots = squad.perGameweekSlots[gameweek] ?? [];
  const { includeBench = false, plan } = options;

  const xiSlots = slots.filter((s) => s.role === "XI");
  const benchSlots = slots.filter((s) => s.role === "BENCH");

  const relevantSlots = includeBench ? slots : xiSlots;
  const relevantPlayers = relevantSlots
    .map((slot) => squad.players.find((p) => p.id === slot.playerId))
    .filter((p): p is Player => p !== undefined);

  const doublingPlayers = relevantPlayers.filter((p) =>
    isTeamDoubling(p.team, gameweek, plan)
  );

  const positionCounts: Record<string, number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0
  };

  for (const player of relevantPlayers) {
    positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
  }

  return {
    totalPlayers: relevantPlayers.length,
    xiCount: xiSlots.length,
    benchCount: benchSlots.length,
    doublingPlayers,
    positionCounts
  };
}

/**
 * Calculate transfer cost (hits) for a gameweek.
 */
export function calculateTransferCost(
  events: PlanEvent[],
  gameweek: number,
  freeTransfers: number = 1
): number {
  const gwTransfersIn = events.filter(
    (ev) => ev.type === "TRANSFER_IN" && ev.gameweek === gameweek
  );

  const extraTransfers = Math.max(0, gwTransfersIn.length - freeTransfers);
  return extraTransfers * 4;
}

/**
 * Get players by position from a squad for a specific gameweek.
 */
export function getPlayersByPosition(
  squad: Squad,
  gameweek: number,
  position: "GK" | "DEF" | "MID" | "FWD",
  role?: "XI" | "BENCH"
): Player[] {
  const slots = squad.perGameweekSlots[gameweek] ?? [];
  const filteredSlots = role ? slots.filter((s) => s.role === role) : slots;

  return filteredSlots
    .map((slot) => squad.players.find((p) => p.id === slot.playerId))
    .filter((p): p is Player => p !== undefined && p.position === position);
}
