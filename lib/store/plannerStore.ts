"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Squad,
  PlanEvent,
  OpponentSquadByGW,
  Player,
  ChipEvent
} from "../models";
import { baseSquad, mockOpponentSquads } from "../mockSquads";
import { GAMEWEEKS } from "../fixtures";
import {
  applyPlanEventsUpToGW,
  computeSquadSummaryForGW,
  isBenchBoostActive,
  getChipsForGW
} from "../plannerLogic";

export interface PlannerState {
  startingGW: number;
  endingGW: number;
  baseSquad: Squad;
  planEvents: PlanEvent[];
  opponentSquads: OpponentSquadByGW;
  selectedH2HGW: number | null;
  captains: Record<number, string | undefined>;
}

export interface PlannerActions {
  setGWRange: (start: number, end: number) => void;
  setBaseSquad: (squad: Squad) => void;
  addPlanEvent: (event: PlanEvent) => void;
  removePlanEvent: (gameweek: number, predicate: (ev: PlanEvent) => boolean) => void;
  setOpponentSquadForGW: (gw: number, players: Player[]) => void;
  addOpponentPlayerToGW: (gw: number, player: Player) => void;
  removeOpponentPlayerFromGW: (gw: number, playerId: string) => void;
  setSelectedH2HGW: (gw: number | null) => void;
  setCaptainForGW: (gw: number, playerId: string | undefined) => void;
  copyXIFromPreviousGW: (gw: number) => void;
  movePlayerBetweenRoles: (gw: number, playerId: string, targetRole: "XI" | "BENCH") => void;
  resetPlanner: () => void;
  getSquadForGW: (gw: number) => Squad;
  getSummaryForGW: (gw: number) => ReturnType<typeof computeSquadSummaryForGW>;
  getChipsForGW: (gw: number) => ChipEvent[];
  getCaptainForGW: (gw: number) => string | undefined;
}

const initialState: PlannerState = {
  startingGW: GAMEWEEKS[0],
  endingGW: GAMEWEEKS[GAMEWEEKS.length - 1],
  baseSquad,
  planEvents: [],
  opponentSquads: mockOpponentSquads,
  selectedH2HGW: null,
  captains: {}
};

export const usePlannerStore = create<PlannerState & PlannerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGWRange: (start, end) => set({ startingGW: start, endingGW: end }),

      setBaseSquad: (squad) => set({ baseSquad: squad }),

      addPlanEvent: (event) =>
        set((s) => ({ planEvents: [...s.planEvents, event] })),

      removePlanEvent: (gameweek, predicate) =>
        set((s) => ({
          planEvents: s.planEvents.filter(
            (ev) => ev.gameweek !== gameweek || !predicate(ev)
          )
        })),

      setOpponentSquadForGW: (gw, players) =>
        set((s) => ({
          opponentSquads: { ...s.opponentSquads, [gw]: { players } }
        })),

      addOpponentPlayerToGW: (gw, player) =>
        set((s) => {
          const existing = s.opponentSquads[gw]?.players ?? [];
          return {
            opponentSquads: {
              ...s.opponentSquads,
              [gw]: { players: [...existing, player] }
            }
          };
        }),

      removeOpponentPlayerFromGW: (gw, playerId) =>
        set((s) => {
          const existing = s.opponentSquads[gw]?.players ?? [];
          return {
            opponentSquads: {
              ...s.opponentSquads,
              [gw]: { players: existing.filter((p) => p.id !== playerId) }
            }
          };
        }),

      setSelectedH2HGW: (gw) => set({ selectedH2HGW: gw }),

      setCaptainForGW: (gw, playerId) =>
        set((s) => ({
          captains: { ...s.captains, [gw]: playerId }
        })),

      copyXIFromPreviousGW: (gw) =>
        set((s) => {
          const prevSlots = s.baseSquad.perGameweekSlots[gw - 1];
          if (!prevSlots) return s;
          const validIds = new Set(s.baseSquad.players.map((p) => p.id));
          const copied = prevSlots.filter((slot) => validIds.has(slot.playerId));
          return {
            baseSquad: {
              ...s.baseSquad,
              perGameweekSlots: {
                ...s.baseSquad.perGameweekSlots,
                [gw]: copied
              }
            }
          };
        }),

      movePlayerBetweenRoles: (gw, playerId, targetRole) =>
        set((s) => {
          const slots = s.baseSquad.perGameweekSlots[gw] ?? [];
          const updated = slots.map((slot) =>
            slot.playerId === playerId ? { ...slot, role: targetRole } : slot
          );
          return {
            baseSquad: {
              ...s.baseSquad,
              perGameweekSlots: {
                ...s.baseSquad.perGameweekSlots,
                [gw]: updated
              }
            }
          };
        }),

      resetPlanner: () => set(initialState),

      getSquadForGW: (gw) => {
        const state = get();
        const events = state.planEvents.filter((e) => e.gameweek <= gw);
        return applyPlanEventsUpToGW(state.baseSquad, events, gw);
      },

      getSummaryForGW: (gw) => {
        const state = get();
        const squad = applyPlanEventsUpToGW(
          state.baseSquad,
          state.planEvents.filter((e) => e.gameweek <= gw),
          gw
        );
        const includeBench = isBenchBoostActive(state.planEvents, gw);
        return computeSquadSummaryForGW(squad, gw, { includeBench });
      },

      getChipsForGW: (gw) => {
        const state = get();
        return getChipsForGW(state.planEvents, gw);
      },

      getCaptainForGW: (gw) => {
        const state = get();
        return state.captains[gw];
      }
    }),
    { name: "paper-h2h-lab" }
  )
);
