// lib/models.ts
// Core type definitions for Paper H2H Lab.

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;
  name: string;
  team: string;
  position: Position;
}

export interface PlayerSlot {
  playerId: string;
  role: "XI" | "BENCH";
}

export interface Squad {
  players: Player[];
  perGameweekSlots: Record<number, PlayerSlot[]>;
}

export type ChipType = "WC" | "FH" | "BB" | "TC";

export interface TransferInEvent {
  type: "TRANSFER_IN";
  gameweek: number;
  playerId: string;
  playerData?: Player;
}

export interface TransferOutEvent {
  type: "TRANSFER_OUT";
  gameweek: number;
  playerId: string;
}

export interface ChipEvent {
  type: "CHIP";
  gameweek: number;
  chip: ChipType;
}

export type PlanEvent = TransferInEvent | TransferOutEvent | ChipEvent;

export interface OpponentSquad {
  players: Player[];
}

export type OpponentSquadByGW = Record<number, OpponentSquad>;

export type RiskLevel = "green" | "amber" | "red";

export interface HeadToHeadResult {
  myDifferentials: Player[];
  theirDifferentials: Player[];
  riskLevel: RiskLevel;
  overlapPercentage: number;
  myCaptainDoubling: boolean;
  theirCaptainDoubling: boolean;
}

export interface Fixture {
  gameweek: number;
  home: string;
  away: string;
  isDouble?: boolean;
}

// ============================================
// New types for Setup Flow & Plans
// ============================================

export interface Opponent {
  teamId: number;
  teamName: string;
  managerName: string;
}

export interface H2HLeague {
  id: number;
  name: string;
  entryRank: number | null;
}

export interface Plan {
  id: string;
  name: string;
  leagueId: number;
  leagueName: string;
  startGW: number;
  endGW: number;
  opponents: Record<number, Opponent>;  // GW -> opponent
  squad: Squad;
  planEvents: PlanEvent[];
  captains: Record<number, string | undefined>;
  opponentSquads: OpponentSquadByGW;
  createdAt: number;
  updatedAt: number;
}

export interface UserConfig {
  fplTeamId: string;
  fplTeamName: string;
  managerName: string;
  h2hLeagues: H2HLeague[];
  plans: Plan[];
  activePlanId: string | null;
  setupComplete: boolean;
}

export const MAX_PLANS = 5;
export const MAX_GW_SPAN = 7;

export function createEmptyPlan(
  id: string,
  name: string,
  leagueId: number,
  leagueName: string,
  startGW: number,
  endGW: number
): Plan {
  const now = Date.now();
  
  // Initialize empty slots for each GW
  const perGameweekSlots: Record<number, PlayerSlot[]> = {};
  for (let gw = startGW; gw <= endGW; gw++) {
    perGameweekSlots[gw] = [];
  }

  return {
    id,
    name,
    leagueId,
    leagueName,
    startGW,
    endGW,
    opponents: {},
    squad: {
      players: [],
      perGameweekSlots
    },
    planEvents: [],
    captains: {},
    opponentSquads: {},
    createdAt: now,
    updatedAt: now
  };
}
