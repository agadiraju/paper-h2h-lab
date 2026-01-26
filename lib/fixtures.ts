// lib/fixtures.ts
// Mock fixture data for Paper H2H Lab.

import { Fixture } from "./models";

// Gameweeks 24-30 as the planning window
export const GAMEWEEKS = [24, 25, 26, 27, 28, 29, 30];

export const fixtures: Fixture[] = [
  // GW24
  { gameweek: 24, home: "ARS", away: "MCI" },
  { gameweek: 24, home: "LIV", away: "CHE" },
  { gameweek: 24, home: "MUN", away: "TOT" },
  { gameweek: 24, home: "NEW", away: "AVL" },
  { gameweek: 24, home: "BHA", away: "BRE" },
  { gameweek: 24, home: "FUL", away: "BOU" },
  { gameweek: 24, home: "WHU", away: "EVE" },
  { gameweek: 24, home: "WOL", away: "CRY" },
  { gameweek: 24, home: "NFO", away: "IPS" },
  { gameweek: 24, home: "LEI", away: "SOU" },

  // GW25 - Double gameweek for some teams
  { gameweek: 25, home: "MCI", away: "LIV" },
  { gameweek: 25, home: "CHE", away: "ARS" },
  { gameweek: 25, home: "TOT", away: "NEW" },
  { gameweek: 25, home: "AVL", away: "MUN" },
  { gameweek: 25, home: "BRE", away: "WHU" },
  { gameweek: 25, home: "BOU", away: "WOL" },
  { gameweek: 25, home: "EVE", away: "BHA" },
  { gameweek: 25, home: "CRY", away: "FUL" },
  { gameweek: 25, home: "SOU", away: "NFO" },
  { gameweek: 25, home: "IPS", away: "LEI" },
  // Double fixtures
  { gameweek: 25, home: "LIV", away: "EVE", isDouble: true },
  { gameweek: 25, home: "ARS", away: "TOT", isDouble: true },

  // GW26
  { gameweek: 26, home: "LIV", away: "MUN" },
  { gameweek: 26, home: "ARS", away: "NEW" },
  { gameweek: 26, home: "MCI", away: "TOT" },
  { gameweek: 26, home: "CHE", away: "AVL" },
  { gameweek: 26, home: "BHA", away: "WHU" },
  { gameweek: 26, home: "BRE", away: "EVE" },
  { gameweek: 26, home: "FUL", away: "WOL" },
  { gameweek: 26, home: "NFO", away: "BOU" },
  { gameweek: 26, home: "LEI", away: "CRY" },
  { gameweek: 26, home: "IPS", away: "SOU" },

  // GW27 - Blank for some
  { gameweek: 27, home: "MUN", away: "MCI" },
  { gameweek: 27, home: "TOT", away: "LIV" },
  { gameweek: 27, home: "NEW", away: "CHE" },
  { gameweek: 27, home: "AVL", away: "ARS" },
  { gameweek: 27, home: "WHU", away: "BRE" },
  { gameweek: 27, home: "WOL", away: "BHA" },
  { gameweek: 27, home: "EVE", away: "FUL" },
  { gameweek: 27, home: "CRY", away: "NFO" },
  { gameweek: 27, home: "BOU", away: "LEI" },
  { gameweek: 27, home: "SOU", away: "IPS" },

  // GW28
  { gameweek: 28, home: "ARS", away: "LIV" },
  { gameweek: 28, home: "MCI", away: "CHE" },
  { gameweek: 28, home: "MUN", away: "NEW" },
  { gameweek: 28, home: "TOT", away: "AVL" },
  { gameweek: 28, home: "BHA", away: "BOU" },
  { gameweek: 28, home: "BRE", away: "WOL" },
  { gameweek: 28, home: "FUL", away: "WHU" },
  { gameweek: 28, home: "NFO", away: "EVE" },
  { gameweek: 28, home: "LEI", away: "CRY" },
  { gameweek: 28, home: "IPS", away: "SOU" },

  // GW29
  { gameweek: 29, home: "LIV", away: "ARS" },
  { gameweek: 29, home: "CHE", away: "MCI" },
  { gameweek: 29, home: "NEW", away: "MUN" },
  { gameweek: 29, home: "AVL", away: "TOT" },
  { gameweek: 29, home: "BOU", away: "BHA" },
  { gameweek: 29, home: "WOL", away: "BRE" },
  { gameweek: 29, home: "WHU", away: "FUL" },
  { gameweek: 29, home: "EVE", away: "NFO" },
  { gameweek: 29, home: "CRY", away: "LEI" },
  { gameweek: 29, home: "SOU", away: "IPS" },

  // GW30
  { gameweek: 30, home: "MCI", away: "ARS" },
  { gameweek: 30, home: "LIV", away: "CHE" },
  { gameweek: 30, home: "MUN", away: "TOT" },
  { gameweek: 30, home: "NEW", away: "AVL" },
  { gameweek: 30, home: "BHA", away: "BRE" },
  { gameweek: 30, home: "FUL", away: "BOU" },
  { gameweek: 30, home: "WHU", away: "EVE" },
  { gameweek: 30, home: "WOL", away: "CRY" },
  { gameweek: 30, home: "NFO", away: "IPS" },
  { gameweek: 30, home: "LEI", away: "SOU" }
];

// Teams with double gameweeks
export const DOUBLE_GAMEWEEK_TEAMS: Record<number, string[]> = {
  25: ["LIV", "ARS", "EVE", "TOT"]
};

// Teams with blank gameweeks
export const BLANK_GAMEWEEK_TEAMS: Record<number, string[]> = {
  // No blanks in this sample
};
