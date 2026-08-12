import type { TransitionRule } from "../types/settings";
import type {
  CandidateAutomationResult,
  CandidateEvaluation,
} from "../types/candidates";

type EvaluationJobInput = {
  skillKeywords: string[];
  atsKeywords: string[];
};

type AutomationStageInput = {
  id: string;
  name: string;
  transitionRule?: TransitionRule;
};

const COMMUNICATION_KEYWORDS = [
  "communication",
  "presentation",
  "collaboration",
  "stakeholder",
  "leadership",
  "client",
  "teamwork",
  "mentoring",
  "facilitation",
];

const clampScore = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

const normalizeKeywords = (keywords: string[]): string[] =>
  keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean);

export const calcKeywordMatch = (requiredKeywords: string[], candidateKeywords: string[]): number => {
  if (requiredKeywords.length === 0 || candidateKeywords.length === 0) {
    return 0;
  }

  const required = normalizeKeywords(requiredKeywords);
  const candidate = new Set(normalizeKeywords(candidateKeywords));
  const matched = required.filter((keyword) => candidate.has(keyword)).length;

  return clampScore((matched / required.length) * 100);
};

export const buildCandidateEvaluation = (
  job: EvaluationJobInput,
  profileKeywords: string[]
): CandidateEvaluation => {
  const normalizedProfile = normalizeKeywords(profileKeywords);
  const atsScore = calcKeywordMatch(job.atsKeywords, normalizedProfile);
  const skillScore = calcKeywordMatch(job.skillKeywords, normalizedProfile);
  const communicationMatches = COMMUNICATION_KEYWORDS.filter((keyword) =>
    normalizedProfile.includes(keyword)
  ).length;
  const communicationScore = clampScore(42 + communicationMatches * 12 + Math.min(22, normalizedProfile.length * 2));
  const codingScore = clampScore(atsScore * 0.55 + skillScore * 0.3 + Math.min(15, normalizedProfile.length * 1.5));
  const domainScore = clampScore(atsScore * 0.7 + skillScore * 0.3);
  const overallScore = clampScore(codingScore * 0.4 + communicationScore * 0.2 + domainScore * 0.4);

  let summary = "Profile needs deeper manual review before progressing.";
  if (overallScore >= 85) {
    summary = "Strong profile alignment with high confidence for the next stage.";
  } else if (overallScore >= 70) {
    summary = "Good profile fit with enough evidence to continue in the pipeline.";
  } else if (overallScore >= 55) {
    summary = "Mixed fit. Some relevant signals exist, but gaps need recruiter validation.";
  }

  return {
    overallScore,
    atsScore,
    codingScore,
    communicationScore,
    domainScore,
    summary,
  };
};

export const evaluateAutomationForStage = (params: {
  stages: AutomationStageInput[];
  currentStageId: string;
  overallScore: number;
}): CandidateAutomationResult => {
  const currentIndex = params.stages.findIndex((stage) => stage.id === params.currentStageId);
  if (currentIndex === -1) {
    return {
      action: "none",
      summary: "No matching stage found for automation.",
    };
  }

  const currentStage = params.stages[currentIndex];
  const rule = currentStage.transitionRule;
  if (!rule || rule.type !== "score") {
    return {
      action: "none",
      summary: "Current stage requires manual review or has no automation rule.",
    };
  }

  if (params.overallScore >= rule.minScorePercent) {
    const nextStage = params.stages[currentIndex + 1];
    if (nextStage) {
      return {
        action: "advance",
        nextStageId: nextStage.id,
        status: "active",
        summary: `Auto-moved to ${nextStage.name} because score ${params.overallScore}% met the ${rule.minScorePercent}% threshold.`,
      };
    }

    return {
      action: "select",
      status: "selected",
      summary: `Candidate reached ${params.overallScore}% and cleared the final stage threshold.`,
    };
  }

  if (params.overallScore >= Math.max(40, rule.minScorePercent - 15)) {
    return {
      action: "hold",
      status: "hold",
      summary: `Candidate moved to hold because score ${params.overallScore}% was below the ${rule.minScorePercent}% threshold.`,
    };
  }

  return {
    action: "reject",
    status: "rejected",
    summary: `Candidate was auto-rejected because score ${params.overallScore}% was well below the ${rule.minScorePercent}% threshold.`,
  };
};