// lib/mockSquads.ts
// Mock squad data for Paper H2H Lab.

import { Squad, Player, OpponentSquadByGW } from "./models";
import { GAMEWEEKS } from "./fixtures";

// Sample players for the base squad
const samplePlayers: Player[] = [
  { id: "p1", name: "Alisson", team: "LIV", position: "GK" },
  { id: "p2", name: "Henderson", team: "CRY", position: "GK" },
  { id: "p3", name: "Alexander-Arnold", team: "LIV", position: "DEF" },
  { id: "p4", name: "Saliba", team: "ARS", position: "DEF" },
  { id: "p5", name: "Gabriel", team: "ARS", position: "DEF" },
  { id: "p6", name: "Hall", team: "NEW", position: "DEF" },
  { id: "p7", name: "Dalot", team: "MUN", position: "DEF" },
  { id: "p8", name: "Salah", team: "LIV", position: "MID" },
  { id: "p9", name: "Palmer", team: "CHE", position: "MID" },
  { id: "p10", name: "Saka", team: "ARS", position: "MID" },
  { id: "p11", name: "Gordon", team: "NEW", position: "MID" },
  { id: "p12", name: "Mbeumo", team: "BRE", position: "MID" },
  { id: "p13", name: "Haaland", team: "MCI", position: "FWD" },
  { id: "p14", name: "Isak", team: "NEW", position: "FWD" },
  { id: "p15", name: "Watkins", team: "AVL", position: "FWD" }
];

// Generate per-gameweek slots (all players in XI by default, last 4 on bench)
function generatePerGameweekSlots(): Record<number, { playerId: string; role: "XI" | "BENCH" }[]> {
  const slots: Record<number, { playerId: string; role: "XI" | "BENCH" }[]> = {};

  for (const gw of GAMEWEEKS) {
    slots[gw] = samplePlayers.map((player, idx) => ({
      playerId: player.id,
      role: idx < 11 ? "XI" : "BENCH"
    }));
  }

  return slots;
}

export const baseSquad: Squad = {
  players: samplePlayers,
  perGameweekSlots: generatePerGameweekSlots()
};

// Mock opponent squads for H2H comparison
const opponentPlayers: Player[] = [
  { id: "opp1", name: "Raya", team: "ARS", position: "GK" },
  { id: "opp2", name: "Alexander-Arnold", team: "LIV", position: "DEF" },
  { id: "opp3", name: "Van Dijk", team: "LIV", position: "DEF" },
  { id: "opp4", name: "Saliba", team: "ARS", position: "DEF" },
  { id: "opp5", name: "Gvardiol", team: "MCI", position: "DEF" },
  { id: "opp6", name: "Salah", team: "LIV", position: "MID" },
  { id: "opp7", name: "Palmer", team: "CHE", position: "MID" },
  { id: "opp8", name: "Ødegaard", team: "ARS", position: "MID" },
  { id: "opp9", name: "Foden", team: "MCI", position: "MID" },
  { id: "opp10", name: "Haaland", team: "MCI", position: "FWD" },
  { id: "opp11", name: "Havertz", team: "ARS", position: "FWD" }
];

export const mockOpponentSquads: OpponentSquadByGW = {
  24: { players: opponentPlayers },
  25: { players: opponentPlayers },
  26: { players: opponentPlayers },
  27: { players: opponentPlayers },
  28: { players: opponentPlayers },
  29: { players: opponentPlayers },
  30: { players: opponentPlayers }
};
