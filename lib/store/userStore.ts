"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  UserConfig,
  Plan,
  H2HLeague,
  Player,
  Squad,
  Opponent,
  MAX_PLANS,
  createEmptyPlan
} from "../models";

interface UserState extends UserConfig {
  // Actions
  setFplTeamId: (id: string) => void;
  setFplTeamInfo: (teamId: string, teamName: string, managerName: string) => void;
  setH2HLeagues: (leagues: H2HLeague[]) => void;
  setSetupComplete: (complete: boolean) => void;
  
  // Plan management
  addPlan: (plan: Plan) => boolean;
  updatePlan: (planId: string, updates: Partial<Plan>) => void;
  deletePlan: (planId: string) => void;
  setActivePlan: (planId: string | null) => void;
  getActivePlan: () => Plan | null;
  
  // Reset
  resetAll: () => void;
  
  // Squad management within active plan
  setSquadForActivePlan: (squad: Squad) => void;
  setOpponentsForActivePlan: (opponents: Record<number, Opponent>) => void;
  
  // Reset
  resetUser: () => void;
}

const initialState: UserConfig = {
  fplTeamId: "",
  fplTeamName: "",
  managerName: "",
  h2hLeagues: [],
  plans: [],
  activePlanId: null,
  setupComplete: false
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFplTeamId: (id) => set({ fplTeamId: id }),

      setFplTeamInfo: (teamId, teamName, managerName) =>
        set({
          fplTeamId: teamId,
          fplTeamName: teamName,
          managerName
        }),

      setH2HLeagues: (leagues) => set({ h2hLeagues: leagues }),

      setSetupComplete: (complete) => set({ setupComplete: complete }),

      addPlan: (plan) => {
        const state = get();
        if (state.plans.length >= MAX_PLANS) {
          return false;
        }
        set({
          plans: [...state.plans, plan],
          activePlanId: plan.id
        });
        return true;
      },

      updatePlan: (planId, updates) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? { ...p, ...updates, updatedAt: Date.now() }
              : p
          )
        })),

      deletePlan: (planId) =>
        set((state) => {
          const newPlans = state.plans.filter((p) => p.id !== planId);
          const newActivePlanId =
            state.activePlanId === planId
              ? newPlans.length > 0
                ? newPlans[0].id
                : null
              : state.activePlanId;
          return {
            plans: newPlans,
            activePlanId: newActivePlanId
          };
        }),

      setActivePlan: (planId) => set({ activePlanId: planId }),

      getActivePlan: () => {
        const state = get();
        if (!state.activePlanId) return null;
        return state.plans.find((p) => p.id === state.activePlanId) ?? null;
      },

      setSquadForActivePlan: (squad) =>
        set((state) => {
          if (!state.activePlanId) return state;
          return {
            plans: state.plans.map((p) =>
              p.id === state.activePlanId
                ? { ...p, squad, updatedAt: Date.now() }
                : p
            )
          };
        }),

      setOpponentsForActivePlan: (opponents) =>
        set((state) => {
          if (!state.activePlanId) return state;
          return {
            plans: state.plans.map((p) =>
              p.id === state.activePlanId
                ? { ...p, opponents, updatedAt: Date.now() }
                : p
            )
          };
        }),

      resetUser: () => set(initialState),

      resetAll: () => {
        // Clear persisted storage and reset state
        localStorage.removeItem("paper-h2h-user");
        set(initialState);
      }
    }),
    { name: "paper-h2h-user" }
  )
);
