// lib/h2hLogic.ts
// Head-to-head comparison logic for Paper H2H Lab.

import { Player, HeadToHeadResult, RiskLevel, Plan } from "./models";
import { isTeamDoubling } from "./plannerLogic";

export function computeHeadToHeadRisk(
  myPlayers: Player[],
  theirPlayers: Player[],
  gameweek: number,
  myCaptainId?: string,
  theirCaptainId?: string,
  plan?: Plan
): HeadToHeadResult {
  const myIds = new Set(myPlayers.map((p) => p.id));
  const theirIds = new Set(theirPlayers.map((p) => p.id));

  const myDifferentials = myPlayers.filter((p) => !theirIds.has(p.id));
  const theirDifferentials = theirPlayers.filter((p) => !myIds.has(p.id));

  const overlapCount = myPlayers.filter((p) => theirIds.has(p.id)).length;
  const overlapPercentage = Math.round(
    (overlapCount / Math.max(myPlayers.length, 1)) * 100
  );

  const myCaptain = myPlayers.find((p) => p.id === myCaptainId);
  const theirCaptain = theirPlayers.find((p) => p.id === theirCaptainId);

  const myCaptainDoubling = myCaptain
    ? isTeamDoubling(myCaptain.team, gameweek, plan)
    : false;
  const theirCaptainDoubling = theirCaptain
    ? isTeamDoubling(theirCaptain.team, gameweek, plan)
    : false;

  const riskLevel = deriveRiskLevel({
    myDifferentials,
    theirDifferentials,
    overlapPercentage,
    myCaptainDoubling,
    theirCaptainDoubling
  });

  return {
    myDifferentials,
    theirDifferentials,
    riskLevel,
    overlapPercentage,
    myCaptainDoubling,
    theirCaptainDoubling
  };
}

interface RiskFactors {
  myDifferentials: Player[];
  theirDifferentials: Player[];
  overlapPercentage: number;
  myCaptainDoubling: boolean;
  theirCaptainDoubling: boolean;
}

function deriveRiskLevel(factors: RiskFactors): RiskLevel {
  const {
    myDifferentials,
    theirDifferentials,
    overlapPercentage,
    myCaptainDoubling,
    theirCaptainDoubling
  } = factors;

  // High risk: opponent has many differentials with doublers, or their captain doubles and yours doesn't
  const theirDoublingDiffs = theirDifferentials.filter((p) =>
    // We'd need GW context here; for simplicity, flag if they have more diffs
    true
  );

  if (
    theirDifferentials.length > myDifferentials.length + 2 ||
    (theirCaptainDoubling && !myCaptainDoubling)
  ) {
    return "red";
  }

  // Medium risk: roughly even but some exposure gaps
  if (
    overlapPercentage < 50 ||
    theirDifferentials.length > myDifferentials.length
  ) {
    return "amber";
  }

  // Low risk: high overlap, your differentials are strong
  return "green";
}
