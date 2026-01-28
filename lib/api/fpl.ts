// lib/api/fpl.ts
// FPL API fetch functions for Paper H2H Lab.
// Uses local proxy to bypass CORS.

const FPL_PROXY = "/api/fpl";

export interface FPLPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
}

export interface FPLTeam {
  id: number;
  short_name: string;
  name: string;
}

export interface FPLBootstrap {
  elements: FPLPlayer[];
  teams: FPLTeam[];
  events: { id: number; finished: boolean; is_current: boolean }[];
}

export interface FPLEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  leagues: {
    h2h: FPLLeagueSummary[];
  };
}

export interface FPLLeagueSummary {
  id: number;
  name: string;
  entry_rank: number | null;
  entry_last_rank: number | null;
}

export interface FPLPick {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
}

export interface FPLPicksResponse {
  active_chip: string | null;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
  };
  picks: FPLPick[];
}

export interface FPLH2HMatch {
  id: number;
  event: number;
  entry_1_entry: number;
  entry_1_name: string;
  entry_1_player_name: string;
  entry_1_points: number;
  entry_2_entry: number;
  entry_2_name: string;
  entry_2_player_name: string;
  entry_2_points: number;
  is_knockout: boolean;
  winner: number | null;
}

export interface FPLH2HMatchesResponse {
  has_next: boolean;
  page: number;
  results: FPLH2HMatch[];
}

// Cache bootstrap data (large payload, rarely changes)
let bootstrapCache: FPLBootstrap | null = null;

/**
 * Fetch bootstrap data (all players, teams, events).
 */
export async function fetchBootstrap(): Promise<FPLBootstrap> {
  if (bootstrapCache) return bootstrapCache;

  const res = await fetch(`${FPL_PROXY}/bootstrap-static/`);
  if (!res.ok) throw new Error(`Failed to fetch bootstrap: ${res.status}`);

  bootstrapCache = await res.json();
  return bootstrapCache!;
}

/**
 * Fetch entry (team) info including H2H leagues.
 */
export async function fetchEntry(teamId: string): Promise<FPLEntry> {
  const res = await fetch(`${FPL_PROXY}/entry/${teamId}/`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Team not found. Check your FPL ID.");
    throw new Error(`Failed to fetch entry: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch picks for a specific gameweek.
 */
export async function fetchPicks(
  teamId: string,
  gameweek: number
): Promise<FPLPicksResponse> {
  const res = await fetch(`${FPL_PROXY}/entry/${teamId}/event/${gameweek}/picks/`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`No picks found for GW${gameweek}`);
    throw new Error(`Failed to fetch picks: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch ALL H2H matches for a league (paginated, fetches all pages).
 * This includes past and future fixtures.
 */
export async function fetchAllH2HMatches(
  leagueId: string,
  entryId?: string
): Promise<FPLH2HMatch[]> {
  const allMatches: FPLH2HMatch[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const entryParam = entryId ? `&entry=${entryId}` : "";
    const res = await fetch(
      `${FPL_PROXY}/leagues-h2h-matches/league/${leagueId}/?page=${page}${entryParam}`
    );
    if (!res.ok) throw new Error(`Failed to fetch H2H matches: ${res.status}`);

    const data: FPLH2HMatchesResponse = await res.json();
    allMatches.push(...data.results);
    hasNext = data.has_next;
    page++;

    if (page > 50) break;
  }

  return allMatches;
}

/**
 * Fetch H2H matches for a specific gameweek.
 */
export async function fetchH2HMatchesForGameweek(
  leagueId: string,
  gameweek: number
): Promise<FPLH2HMatch[]> {
  const res = await fetch(
    `${FPL_PROXY}/leagues-h2h-matches/league/${leagueId}/?event=${gameweek}`
  );
  if (!res.ok) throw new Error(`Failed to fetch H2H matches: ${res.status}`);

  const data: FPLH2HMatchesResponse = await res.json();
  return data.results;
}

/**
 * Get current gameweek from bootstrap.
 */
export async function getCurrentGameweek(): Promise<number> {
  const bootstrap = await fetchBootstrap();
  const current = bootstrap.events.find((e) => e.is_current);
  if (current) return current.id;

  // If no current (between seasons), find last finished
  const finished = bootstrap.events.filter((e) => e.finished);
  return finished.length > 0 ? finished[finished.length - 1].id : 1;
}

/**
 * Map element_type to position string.
 */
export function mapPosition(elementType: number): "GK" | "DEF" | "MID" | "FWD" {
  switch (elementType) {
    case 1: return "GK";
    case 2: return "DEF";
    case 3: return "MID";
    case 4: return "FWD";
    default: return "MID";
  }
}

/**
 * Find your opponent for a given GW in a list of matches.
 */
export function findOpponentInMatches(
  matches: FPLH2HMatch[],
  yourTeamId: number,
  gameweek: number
): FPLH2HMatch | null {
  return (
    matches.find(
      (m) =>
        m.event === gameweek &&
        (m.entry_1_entry === yourTeamId || m.entry_2_entry === yourTeamId)
    ) ?? null
  );
}

/**
 * Extract opponent info from a match.
 */
export function getOpponentFromMatch(
  match: FPLH2HMatch,
  yourTeamId: number
): { teamId: number; teamName: string; managerName: string } | null {
  if (match.entry_1_entry === yourTeamId) {
    return {
      teamId: match.entry_2_entry,
      teamName: match.entry_2_name,
      managerName: match.entry_2_player_name
    };
  } else if (match.entry_2_entry === yourTeamId) {
    return {
      teamId: match.entry_1_entry,
      teamName: match.entry_1_name,
      managerName: match.entry_1_player_name
    };
  }
  return null;
}

/**
 * Get opponents for a range of gameweeks.
 * Fetches all matches once, then filters for each GW.
 */
export async function getOpponentsForRange(
  leagueId: string,
  yourTeamId: number,
  startGW: number,
  endGW: number
): Promise<Record<number, { teamId: number; teamName: string; managerName: string }>> {
  const allMatches = await fetchAllH2HMatches(leagueId, String(yourTeamId));
  const opponents: Record<number, { teamId: number; teamName: string; managerName: string }> = {};

  for (let gw = startGW; gw <= endGW; gw++) {
    const match = findOpponentInMatches(allMatches, yourTeamId, gw);
    if (match) {
      const opp = getOpponentFromMatch(match, yourTeamId);
      if (opp) {
        opponents[gw] = opp;
      }
    }
  }

  return opponents;
}

export interface OpponentSquadPlayer {
  id: string;
  name: string;
  team: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  isCaptain: boolean;
  isViceCaptain: boolean;
  isStarting: boolean; // positions 1-11 are starting
}

export interface OpponentSquadResult {
  players: OpponentSquadPlayer[];
  fetchedFromGW: number; // The GW the data was actually fetched from
  requestedGW: number; // The GW that was originally requested
}

/**
 * Fetch opponent's squad for a specific gameweek.
 * If the requested GW isn't available, falls back to the most recent available GW.
 */
export async function fetchOpponentSquad(
  opponentTeamId: number,
  gameweek: number
): Promise<OpponentSquadResult | null> {
  const bootstrap = await fetchBootstrap();

  // Create lookup maps
  const playerMap = new Map<number, FPLPlayer>();
  for (const p of bootstrap.elements) {
    playerMap.set(p.id, p);
  }

  const teamMap = new Map<number, string>();
  for (const t of bootstrap.teams) {
    teamMap.set(t.id, t.short_name);
  }

  // Find the most recent finished GW
  const finishedGWs = bootstrap.events
    .filter((e) => e.finished)
    .map((e) => e.id)
    .sort((a, b) => b - a); // descending

  // Try requested GW first, then fall back to most recent finished GWs
  const gwsToTry = [gameweek, ...finishedGWs.filter((gw) => gw !== gameweek)];

  for (const gwToTry of gwsToTry) {
    try {
      const picksData = await fetchPicks(String(opponentTeamId), gwToTry);

      // Convert picks to our format
      const players: OpponentSquadPlayer[] = [];
      for (const pick of picksData.picks) {
        const fplPlayer = playerMap.get(pick.element);
        if (!fplPlayer) continue;

        players.push({
          id: `fpl-${pick.element}`,
          name: fplPlayer.web_name,
          team: teamMap.get(fplPlayer.team) ?? "???",
          position: mapPosition(fplPlayer.element_type),
          isCaptain: pick.is_captain,
          isViceCaptain: pick.is_vice_captain,
          isStarting: pick.position <= 11
        });
      }

      return {
        players,
        fetchedFromGW: gwToTry,
        requestedGW: gameweek
      };
    } catch {
      // Try next GW
    }
  }

  // No GW had available picks
  return null;
}

export interface FPLFixture {
  event: number | null; // null if not assigned to a GW yet
  team_h: number;
  team_a: number;
  finished: boolean;
}

export interface GameweekFixtureInfo {
  dgwTeams: string[]; // Teams with 2+ fixtures
  bgwTeams: string[]; // Teams with 0 fixtures
}

/**
 * Analyze fixtures from bootstrap to detect DGWs and BGWs per gameweek.
 * Returns a map of GW -> {dgwTeams, bgwTeams}
 */
export async function detectFixtureAnomalies(): Promise<Record<number, GameweekFixtureInfo>> {
  const bootstrap = await fetchBootstrap();

  // Get team short names
  const teamMap = new Map<number, string>();
  for (const t of bootstrap.teams) {
    teamMap.set(t.id, t.short_name);
  }

  // Fetch fixtures from the API
  const fixturesRes = await fetch(`${FPL_PROXY}/fixtures/`);
  if (!fixturesRes.ok) throw new Error("Failed to fetch fixtures");
  const fixtures: FPLFixture[] = await fixturesRes.json();

  // Count games per team per GW
  const gameCount: Record<number, Record<number, number>> = {};

  for (const fixture of fixtures) {
    if (fixture.event === null) continue; // Skip unassigned fixtures

    const gw = fixture.event;
    if (!gameCount[gw]) gameCount[gw] = {};

    // Count for home team
    gameCount[gw][fixture.team_h] = (gameCount[gw][fixture.team_h] || 0) + 1;
    // Count for away team
    gameCount[gw][fixture.team_a] = (gameCount[gw][fixture.team_a] || 0) + 1;
  }

  // Detect DGWs and BGWs
  const result: Record<number, GameweekFixtureInfo> = {};

  for (const gwStr in gameCount) {
    const gw = Number(gwStr);
    const dgwTeams: string[] = [];
    const bgwTeams: string[] = [];

    // Check each team
    for (const team of bootstrap.teams) {
      const count = gameCount[gw][team.id] || 0;

      if (count >= 2) {
        dgwTeams.push(team.short_name);
      } else if (count === 0) {
        bgwTeams.push(team.short_name);
      }
    }

    if (dgwTeams.length > 0 || bgwTeams.length > 0) {
      result[gw] = { dgwTeams, bgwTeams };
    }
  }

  return result;
}
